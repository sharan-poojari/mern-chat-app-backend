import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Connection from "../models/connection.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

/*
|--------------------------------------------------------------------------
| Helper: Check whether two users have an accepted connection
|--------------------------------------------------------------------------
*/
const isCommunicationAllowed = async (userId, otherUserId) => {
  const connection = await Connection.findOne({
    $or: [
      {
        requesterId: userId,
        recipientId: otherUserId,
      },
      {
        requesterId: otherUserId,
        recipientId: userId,
      },
    ],
    status: "accepted",
  });

  return !!connection;
};

/*
|--------------------------------------------------------------------------
| Get Users For Sidebar
|--------------------------------------------------------------------------
*/
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const connections = await Connection.find({
      $and: [
        {
          $or: [
            { requesterId: loggedInUserId },
            { recipientId: loggedInUserId },
          ],
        },
        {
          $or: [
            { status: "accepted" },
            {
              status: "blocked",
              blockedBy: loggedInUserId,
            },
          ],
        },
      ],
    });

    const contactIds = connections.map((connection) =>
      connection.requesterId.toString() ===
      loggedInUserId.toString()
        ? connection.recipientId
        : connection.requesterId
    );

    const users = await User.find({
      _id: { $in: contactIds },
    }).select("-password");

    const usersWithStatus = users.map((user) => {
      const connection = connections.find((connection) => {
        const otherUserId =
          connection.requesterId.toString() ===
          loggedInUserId.toString()
            ? connection.recipientId.toString()
            : connection.requesterId.toString();

        return otherUserId === user._id.toString();
      });

      return {
        ...user.toObject(),
        isBlocked:
          connection?.status === "blocked" &&
          connection?.blockedBy?.toString() ===
            loggedInUserId.toString(),
      };
    });

    res.status(200).json(usersWithStatus);
  } catch (error) {
    console.log(
      "Error in getUsersForSidebar:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch contacts",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Messages
|--------------------------------------------------------------------------
*/
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const allowed = await isCommunicationAllowed(
      myId,
      userToChatId
    );

    if (!allowed) {
      return res.status(403).json({
        message:
          "You are not authorized to access this conversation",
      });
    }

    const limit = Math.min(
      Number(req.query.limit) || 100,
      100
    );

    const before = req.query.before;

    const query = {
      $or: [
        {
          senderId: myId,
          receiverId: userToChatId,
        },
        {
          senderId: userToChatId,
          receiverId: myId,
        },
      ],
    };

    if (before) {
      const beforeMessage = await Message.findById(
        before
      ).select("createdAt");

      if (beforeMessage) {
        query.createdAt = {
          $lt: beforeMessage.createdAt,
        };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    messages.reverse();

    const unreadCount = await Message.countDocuments({
      senderId: userToChatId,
      receiverId: myId,
      status: { $ne: "read" },
    });

    let hasMore = false;

    if (messages.length > 0) {
      const oldestMessage = messages[0];

      const olderMessage = await Message.findOne({
        $or: [
          {
            senderId: myId,
            receiverId: userToChatId,
          },
          {
            senderId: userToChatId,
            receiverId: myId,
          },
        ],
        createdAt: {
          $lt: oldestMessage.createdAt,
        },
      }).select("_id");

      hasMore = !!olderMessage;
    }

    res.status(200).json({
      messages,
      hasMore,
      unreadCount,
    });
  } catch (error) {
    console.log(
      "Error in getMessages controller:",
      error.message
    );

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Send Message
|--------------------------------------------------------------------------
*/
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;

    if (text && text.trim().length === 0 && !image) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    if (text && text.length > 1000) {
      return res.status(400).json({
        message: "Message is too long",
      });
    }

    const { id: receiverId } = req.params;

    if (!receiverId) {
      return res.status(400).json({
        message: "Receiver ID is required",
      });
    }

    const senderId = req.user._id;

    const allowed = await isCommunicationAllowed(
      senderId,
      receiverId
    );

    if (!allowed) {
      return res.status(403).json({
        message:
          "You are not authorized to message this user",
      });
    }

    let imageUrl;

    if (image) {
      if (!image.startsWith("data:image/")) {
        return res.status(400).json({
          message: "Only image files are allowed",
        });
      }

      if (image.length > 5 * 1024 * 1024) {
        return res.status(400).json({
          message: "Image is too large",
        });
      }

      const uploadResponse =
        await cloudinary.uploader.upload(image);

      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      status: "sent",
    });

    await newMessage.save();

    const receiverSocketId =
      getReceiverSocketId(receiverId);

    const senderSocketId =
      getReceiverSocketId(senderId);

    if (receiverSocketId) {
      newMessage.status = "delivered";

      await newMessage.save();

      io.to(receiverSocketId).emit(
        "newMessage",
        newMessage
      );

      if (senderSocketId) {
        io.to(senderSocketId).emit(
          "messageDelivered",
          {
            messageId: newMessage._id,
          }
        );
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log(
      "Error in sendMessage controller:",
      error.message
    );

    return res.status(500).json({
      message:
        "Something went wrong while sending the message",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Mark Messages As Read
|--------------------------------------------------------------------------
*/
export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    const allowed = await isCommunicationAllowed(
      receiverId,
      senderId
    );

    if (!allowed) {
      return res.status(403).json({
        message:
          "You are not authorized to access these messages",
      });
    }

    const result = await Message.updateMany(
      {
        senderId,
        receiverId,
        status: { $ne: "read" },
      },
      {
        $set: {
          status: "read",
        },
      }
    );

    const senderSocketId =
      getReceiverSocketId(senderId);

    if (senderSocketId) {
      io.to(senderSocketId).emit(
        "messagesRead",
        {
          senderId: receiverId,
        }
      );
    }

    res.status(200).json({
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.log(
      "Error in markMessagesAsRead:",
      error.message
    );

    res.status(500).json({
      message: "Failed to mark messages as read",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Edit Message
|--------------------------------------------------------------------------
*/
export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        message: "Message text cannot be empty",
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        message: "Message is too long",
      });
    }

    const message = await Message.findOne({
      _id: messageId,
      senderId: userId,
    });

    if (!message) {
      return res.status(404).json({
        message:
          "Message not found or unauthorized",
      });
    }

    const allowed = await isCommunicationAllowed(
      userId,
      message.receiverId
    );

    if (!allowed) {
      return res.status(403).json({
        message:
          "You are not authorized to edit this message",
      });
    }

    message.text = text.trim();

    await message.save();

    const receiverSocketId =
      getReceiverSocketId(message.receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "messageEdited",
        {
          messageId: message._id,
          text: message.text,
        }
      );
    }

    res.status(200).json(message);
  } catch (error) {
    console.log(
      "Error in editMessage:",
      error.message
    );

    res.status(500).json({
      message: "Failed to edit message",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Delete Message
|--------------------------------------------------------------------------
*/
export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      senderId: userId,
    });

    if (!message) {
      return res.status(404).json({
        message:
          "Message not found or unauthorized",
      });
    }

    const allowed = await isCommunicationAllowed(
      userId,
      message.receiverId
    );

    if (!allowed) {
      return res.status(403).json({
        message:
          "You are not authorized to delete this message",
      });
    }

    const receiverId = message.receiverId;

    await Message.findByIdAndDelete(messageId);

    const receiverSocketId =
      getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "messageDeleted",
        {
          messageId,
        }
      );
    }

    res.status(200).json({
      message: "Message deleted successfully",
      messageId,
    });
  } catch (error) {
    console.log(
      "Error in deleteMessage:",
      error.message
    );

    res.status(500).json({
      message: "Failed to delete message",
    });
  }
};