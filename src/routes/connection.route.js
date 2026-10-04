import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

import {
  sendRequest,
  getRequests,
  acceptRequest,
  rejectRequest,
  getContacts,
  removeContact,
  blockUser,
  unblockUser,
  discoverUsers,
} from "../controllers/connection.controller.js";

const router = express.Router();

// Send connection request
router.post("/request", protectRoute, sendRequest);

// Get received pending requests
router.get("/requests", protectRoute, getRequests);

// Accept request
router.put("/accept/:id", protectRoute, acceptRequest);

// Reject request
router.delete("/reject/:id", protectRoute, rejectRequest);

// Get accepted contacts
router.get("/contacts", protectRoute, getContacts);

// Remove contact
router.delete("/contact/:id", protectRoute, removeContact);

// Block user
router.put("/block/:id", protectRoute, blockUser);

// Unblock user
router.put("/unblock/:id", protectRoute, unblockUser);

// Discover users
router.get("/discover", protectRoute, discoverUsers);

export default router;