import Connection from "../models/connection.model.js";
import User from "../models/user.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// Send connection request
export const sendRequest = async (req, res) => {
  try {
    const requesterId = req.user._id;
    const { userId: recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (requesterId.toString() === recipientId.toString()) {
      return res.status(400).json({
        message: "You cannot send a request to yourself",
      });
    }

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === "blocked") {
        return res.status(403).json({
          message: "Connection is blocked",
        });
      }

      return res.status(400).json({
        message: "Connection already exists",
      });
    }

    const connection = await Connection.create({
      requesterId,
      recipientId,
      status: "pending",
    });

    res.status(201).json(connection);
  } catch (error) {
    console.log("Error in sendRequest:", error.message);

    res.status(500).json({
      message: "Failed to send connection request",
    });
  }
};

// Get pending requests received by current user
export const getRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await Connection.find({
      recipientId: userId,
      status: "pending",
    })
      .populate("requesterId", "-password")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.log("Error in getRequests:", error.message);

    res.status(500).json({
      message: "Failed to fetch connection requests",
    });
  }
};

// Accept connection request
// Accept connection request
export const acceptRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: connectionId } = req.params;

    const connection = await Connection.findOne({
      _id: connectionId,
      recipientId: userId,
      status: "pending",
    });

    if (!connection) {
      return res.status(404).json({
        message: "Connection request not found",
      });
    }

    connection.status = "accepted";
    await connection.save();

    // Notify the requester in real time
    const requesterSocketId = getReceiverSocketId(
      connection.requesterId.toString()
    );

    if (requesterSocketId) {
      io.to(requesterSocketId).emit("connectionAccepted", {
        userId: userId.toString(),
      });
    }

    res.status(200).json(connection);
  } catch (error) {
    console.log("Error in acceptRequest:", error.message);

    res.status(500).json({
      message: "Failed to accept connection request",
    });
  }
};

// Reject connection request
export const rejectRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: connectionId } = req.params;

    const connection = await Connection.findOne({
      _id: connectionId,
      recipientId: userId,
      status: "pending",
    });

    if (!connection) {
      return res.status(404).json({
        message: "Connection request not found",
      });
    }

    await Connection.findByIdAndDelete(connectionId);

    res.status(200).json({
      message: "Connection request rejected",
    });
  } catch (error) {
    console.log("Error in rejectRequest:", error.message);

    res.status(500).json({
      message: "Failed to reject connection request",
    });
  }
};

// Get accepted contacts
export const getContacts = async (req, res) => {
  try {
    const userId = req.user._id;

    const connections = await Connection.find({
      $or: [{ requesterId: userId }, { recipientId: userId }],
      status: "accepted",
    })
      .populate("requesterId", "-password")
      .populate("recipientId", "-password");

    const contacts = connections.map((connection) => {
      const contact =
        connection.requesterId._id.toString() === userId.toString()
          ? connection.recipientId
          : connection.requesterId;

      return contact;
    });

    res.status(200).json(contacts);
  } catch (error) {
    console.log("Error in getContacts:", error.message);

    res.status(500).json({
      message: "Failed to fetch contacts",
    });
  }
};

// Remove an accepted contact
export const removeContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: contactId } = req.params;

    const connection = await Connection.findOne({
      $or: [
        { requesterId: userId, recipientId: contactId },
        { requesterId: contactId, recipientId: userId },
      ],
      status: "accepted",
    });

    if (!connection) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    await Connection.findByIdAndDelete(connection._id);

    res.status(200).json({
      message: "Contact removed successfully",
    });
  } catch (error) {
    console.log("Error in removeContact:", error.message);

    res.status(500).json({
      message: "Failed to remove contact",
    });
  }
};

// Block user
export const blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: blockedUserId } = req.params;

    if (userId.toString() === blockedUserId.toString()) {
      return res.status(400).json({
        message: "You cannot block yourself",
      });
    }

    const user = await User.findById(blockedUserId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let connection = await Connection.findOne({
      $or: [
        { requesterId: userId, recipientId: blockedUserId },
        { requesterId: blockedUserId, recipientId: userId },
      ],
    });

    if (connection) {
      connection.status = "blocked";
      connection.blockedBy = userId;
      await connection.save();
    } else {
      connection = await Connection.create({
        requesterId: userId,
        recipientId: blockedUserId,
        status: "blocked",
        blockedBy: userId,
      });
    }

    res.status(200).json({
      message: "User blocked successfully",
    });
  } catch (error) {
    console.log("Error in blockUser:", error.message);

    res.status(500).json({
      message: "Failed to block user",
    });
  }
};

// Unblock user
export const unblockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: blockedUserId } = req.params;

    if (userId.toString() === blockedUserId.toString()) {
      return res.status(400).json({
        message: "You cannot unblock yourself",
      });
    }

    const connection = await Connection.findOne({
      $or: [
        {
          requesterId: userId,
          recipientId: blockedUserId,
        },
        {
          requesterId: blockedUserId,
          recipientId: userId,
        },
      ],
      status: "blocked",
      blockedBy: userId,
    });

    if (!connection) {
      return res.status(404).json({
        message: "Blocked connection not found",
      });
    }

    connection.status = "accepted";
    connection.blockedBy = null;

    await connection.save();

    // Notify the other user in real time
    const otherUserSocketId = getReceiverSocketId(
      blockedUserId.toString()
    );

    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("connectionUnblocked", {
        userId: userId.toString(),
      });
    }

    res.status(200).json({
      message: "User unblocked successfully",
      connection,
    });
  } catch (error) {
    console.log("Error in unblockUser:", error.message);

    res.status(500).json({
      message: "Failed to unblock user",
    });
  }
};

// Discover users who are not already accepted contacts
export const discoverUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const connections = await Connection.find({
      $or: [
        { requesterId: loggedInUserId },
        { recipientId: loggedInUserId },
      ],
    });

    const connectedUserIds = connections.map((connection) =>
      connection.requesterId.toString() === loggedInUserId.toString()
        ? connection.recipientId
        : connection.requesterId
    );

    const users = await User.find({
      _id: {
        $nin: [loggedInUserId, ...connectedUserIds],
      },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.log("Error in discoverUsers:", error.message);

    res.status(500).json({
      message: "Failed to discover users",
    });
  }
};