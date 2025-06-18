import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to check if voting is closed
const isVotingClosed = (deadline: Date): boolean => new Date() > deadline;

export const createDecisionRoom = async (req: Request, res: Response) => {
  const { title, explanation, options, deadline } = req.body;
  const userId = req.userId; // From authMiddleware

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated." });
  }
  if (
    !title ||
    !explanation ||
    !options ||
    options.length < 2 ||
    options.length > 5 ||
    !deadline
  ) {
    return res
      .status(400)
      .json({
        message:
          "All fields (title, explanation, 2-5 options, deadline) are required.",
      });
  }

  try {
    const newRoom = await prisma.decisionRoom.create({
      data: {
        title,
        explanation,
        deadline: new Date(deadline), // Ensure deadline is a Date object
        creatorId: userId,
        options: {
          create: options.map((optText: string) => ({ text: optText })),
        },
      },
      include: {
        options: true, // Include the created options in the response
      },
    });
    res
      .status(201)
      .json({ message: "Decision room created successfully!", room: newRoom });
  } catch (error: any) {
    console.error("Error creating decision room:", error);
    res
      .status(500)
      .json({ message: "Server error creating room.", error: error.message });
  }
};

export const getDecisionRooms = async (req: Request, res: Response) => {
  const userId = req.userId; // From authMiddleware

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  try {
    // Fetch rooms created by the authenticated user
    const rooms = await prisma.decisionRoom.findMany({
      where: { creatorId: userId },
      include: { options: true, votes: true }, // Include options and votes for details
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(rooms);
  } catch (error: any) {
    console.error("Error fetching decision rooms:", error);
    res
      .status(500)
      .json({ message: "Server error fetching rooms.", error: error.message });
  }
};

export const getDecisionRoomById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId; // From authMiddleware (for checking creator status)

  try {
    const room = await prisma.decisionRoom.findUnique({
      where: { id },
      include: {
        options: true,
        votes: userId ? { where: { voterId: userId } } : false, // Optionally include user's own vote
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Decision room not found." });
    }

    // Determine if the current user has already voted in this room
    const hasVoted = room.votes && room.votes.length > 0;
    // Remove the `votes` property if it was only for checking `hasVoted`
    const { votes, ...roomWithoutVotes } = room;

    res.status(200).json({
      ...roomWithoutVotes,
      hasVoted,
      isCreator: room.creatorId === userId,
      votingClosed: isVotingClosed(room.deadline),
    });
  } catch (error: any) {
    console.error("Error fetching decision room by ID:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching room details.",
        error: error.message,
      });
  }
};

export const voteInDecisionRoom = async (req: Request, res: Response) => {
  const { id: roomId } = req.params;
  const { optionId } = req.body;
  const userId = req.userId; // For registered users

  // For guest voting, you'd need a robust way to identify them,
  // e.g., a unique ID stored in a cookie.
  // For simplicity, this example enforces one vote per *authenticated* user.
  // Implementing guest voting needs careful consideration of how to prevent multiple votes.
  const voterIdentifier = userId; // If userId is null, it means guest.

  if (!voterIdentifier) {
    return res
      .status(401)
      .json({
        message:
          "You must be logged in to vote in this example. Guest voting requires additional setup (e.g., unique cookie ID).",
      });
  }

  try {
    const room = await prisma.decisionRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      return res.status(404).json({ message: "Decision room not found." });
    }

    if (isVotingClosed(room.deadline)) {
      return res
        .status(400)
        .json({ message: "Voting for this room has closed." });
    }

    // Check if the option exists and belongs to this room
    const option = await prisma.option.findFirst({
      where: { id: optionId, decisionRoomId: roomId },
    });
    if (!option) {
      return res
        .status(400)
        .json({ message: "Invalid option selected for this room." });
    }

    // Enforce one vote per user (registered or guest identified by a unique ID)
    const existingVote = await prisma.vote.findFirst({
      where: {
        decisionRoomId: roomId,
        voterId: voterIdentifier, // This will be userId for authenticated, or unique guest ID
      },
    });

    if (existingVote) {
      return res
        .status(409)
        .json({ message: "You have already voted in this decision room." });
    }

    await prisma.vote.create({
      data: {
        decisionRoomId: roomId,
        optionId,
        voterId: voterIdentifier, // Store the voter's identifier
      },
    });

    // Optionally, fetch and return updated tally
    const updatedTally = await getTallyForRoom(roomId);

    res
      .status(200)
      .json({ message: "Vote cast successfully!", newTally: updatedTally });
  } catch (error: any) {
    console.error("Error casting vote:", error);
    res
      .status(500)
      .json({ message: "Server error casting vote.", error: error.message });
  }
};

export const getDecisionTally = async (req: Request, res: Response) => {
  const { id: roomId } = req.params;
  const userId = req.userId; // For creator check

  try {
    const room = await prisma.decisionRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      return res.status(404).json({ message: "Decision room not found." });
    }

    // Only allow creator to see live tally if voting is not closed
    // Anyone can see final results after deadline
    if (!isVotingClosed(room.deadline) && room.creatorId !== userId) {
      return res
        .status(403)
        .json({
          message: "You are not authorized to view live tallies for this room.",
        });
    }

    const tally = await getTallyForRoom(roomId);
    res
      .status(200)
      .json({ tally, votingClosed: isVotingClosed(room.deadline) });
  } catch (error: any) {
    console.error("Error fetching decision tally:", error);
    res
      .status(500)
      .json({ message: "Server error fetching tally.", error: error.message });
  }
};

// Helper function to calculate tally
const getTallyForRoom = async (roomId: string) => {
  const votes = await prisma.vote.findMany({
    where: { decisionRoomId: roomId },
    select: { optionId: true },
  });

  const tally: { [key: string]: number } = {};
  for (const vote of votes) {
    tally[vote.optionId] = (tally[vote.optionId] || 0) + 1;
  }
  return tally;
};
