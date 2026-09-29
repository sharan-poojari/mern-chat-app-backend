import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const limit = Math.min(Number(req.query.limit) || 100, 100);
    const before = req.query.before;

    const query = {
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    };

    // Load messages older than the given message
    if (before) {
      const beforeMessage = await Message.findById(before).select("createdAt");

      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    // Reverse so frontend receives oldest → newest
    messages.reverse();

    const unreadCount = await Message.countDocuments({
      senderId: userToChatId,
      receiverId: myId,
      status: { $ne: "read" },
    });

    // Check if older messages still exist
    let hasMore = false;

    if (messages.length > 0) {
      const oldestMessage = messages[0];

      const olderMessage = await Message.findOne({
        ...query,
        createdAt: { $lt: oldestMessage.createdAt },
      }).select("_id");

      hasMore = !!olderMessage;
    }

    res.status(200).json({
      messages,
      hasMore,
      unreadCount,
    });
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    if (text && text.trim().length === 0 && !image) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }
    if (text && text.length > 1000) {
      return res.status(400).json({ message: "Message is too long" });
    }
    const { id: receiverId } = req.params;
    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      if (!image.startsWith("data:image/")) {
        return res.status(400).json({ message: "Only image files are allowed" });
      }
      if (image.length > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "Image is too large" });
      }
      const uploadResponse = await cloudinary.uploader.upload(image);
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

    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);

    if (receiverSocketId) {
      newMessage.status = "delivered";
      await newMessage.save();

      io.to(receiverSocketId).emit("newMessage", newMessage);

      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", {
          messageId: newMessage._id,
        });
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error.message);
    return res.status(500).json({
      message: "Something went wrong while sending the message",
    });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

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

    const senderSocketId = getReceiverSocketId(senderId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        senderId: receiverId,
      });
    }

    res.status(200).json({
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.log("Error in markMessagesAsRead:", error.message);

    res.status(500).json({
      message: "Failed to mark messages as read",
    });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    // Validate text
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

    // Find message and make sure current user owns it
    const message = await Message.findOne({
      _id: messageId,
      senderId: userId,
    });

    if (!message) {
      return res.status(404).json({
        message: "Message not found or unauthorized",
      });
    }

    // Update message
    message.text = text.trim();
    await message.save();

    // Notify receiver in real time
    const receiverSocketId = getReceiverSocketId(message.receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", {
        messageId: message._id,
        text: message.text,
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage:", error.message);

    res.status(500).json({
      message: "Failed to edit message",
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    // Find message and make sure current user owns it
    const message = await Message.findOne({
      _id: messageId,
      senderId: userId,
    });

    if (!message) {
      return res.status(404).json({
        message: "Message not found or unauthorized",
      });
    }

    const receiverId = message.receiverId;

    // Delete message
    await Message.findByIdAndDelete(messageId);

    // Notify receiver in real time
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", {
        messageId,
      });
    }

    res.status(200).json({
      message: "Message deleted successfully",
      messageId,
    });
  } catch (error) {
    console.log("Error in deleteMessage:", error.message);

    res.status(500).json({
      message: "Failed to delete message",
    });
  }
};