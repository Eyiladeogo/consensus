import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createDecisionRoom,
  getDecisionRooms,
  getDecisionRoomById,
  voteInDecisionRoom,
  getDecisionTally,
} from "../controllers/decisionController";

const router = Router();

// Protect all decision-related routes
router.use(protect);

// POST /api/decisions - Create a new decision room
router.post("/", createDecisionRoom);

// GET /api/decisions - Get all decision rooms created by the user
router.get("/", getDecisionRooms);

// GET /api/decisions/:id - Get a specific decision room by ID
router.get("/:id", getDecisionRoomById);

// POST /api/decisions/:id/vote - Cast a vote in a decision room
router.post("/:id/vote", voteInDecisionRoom);

// GET /api/decisions/:id/tally - Get live vote tally for a decision room (typically for creator)
router.get("/:id/tally", getDecisionTally);

export default router;
