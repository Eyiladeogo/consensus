import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to check if voting is closed
const isVotingClosed = (deadline: Date): boolean => new Date() > deadline;

export const createDecisionRoom = async (req: Request, res: Response) => {
  const { title, explanation, options, deadline } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated." });
    return;
  }
  if (
    !title ||
    !explanation ||
    !options ||
    options.length < 2 ||
    options.length > 5 ||
    !deadline
  ) {
    res.status(400).json({
      message:
        "All fields (title, explanation, 2-5 options, deadline) are required.",
    });
    return;
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
    res.status(401).json({ message: "User not authenticated." });
    return; // Stop execution
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
        // When fetching a single room, include votes to determine 'hasVoted' status
        // Select specific fields from vote to keep payload minimal
        votes: userId
          ? { where: { voterId: userId }, select: { id: true } }
          : false,
      },
    });

    if (!room) {
      res.status(404).json({ message: "Decision room not found." });
      return; // Stop execution
    }

    // Determine if the current user has already voted in this room
    const hasVoted = room.votes && room.votes.length > 0;
    // Remove the `votes` property from the room object before sending it to the client,
    // as it was only needed for the `hasVoted` check.
    const { votes, ...roomWithoutVotes } = room;

    res.status(200).json({
      ...roomWithoutVotes,
      hasVoted,
      isCreator: room.creatorId === userId,
      votingClosed: isVotingClosed(room.deadline),
    });
  } catch (error: any) {
    console.error("Error fetching decision room by ID:", error);
    res.status(500).json({
      message: "Server error fetching room details.",
      error: error.message,
    });
  }
};

export const voteInDecisionRoom = async (req: Request, res: Response) => {
  const { id: roomId } = req.params;
  const { optionId, comment } = req.body;
  const userId = req.userId; // For registered users

  const voterIdentifier = userId;

  if (!voterIdentifier) {
    res.status(401).json({
      message:
        "You must be logged in to vote in this example. Guest voting requires additional setup (e.g., unique cookie ID).",
    });
    return;
  }

  try {
    const room = await prisma.decisionRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      res.status(404).json({ message: "Decision room not found." });
      return;
    }

    if (isVotingClosed(room.deadline)) {
      res.status(400).json({ message: "Voting for this room has closed." });
      return;
    }

    const option = await prisma.option.findFirst({
      where: { id: optionId, decisionRoomId: roomId },
    });
    if (!option) {
      res
        .status(400)
        .json({ message: "Invalid option selected for this room." });
      return;
    }

    const existingVote = await prisma.vote.findFirst({
      where: {
        decisionRoomId: roomId,
        voterId: voterIdentifier,
      },
    });

    if (existingVote) {
      res
        .status(409)
        .json({ message: "You have already voted in this decision room." });
      return;
    }

    await prisma.vote.create({
      data: {
        decisionRoomId: roomId,
        optionId,
        voterId: voterIdentifier,
        userId: userId,
        comment: comment || null,
      },
    });

    const updatedTally = await getTallyForRoom(roomId);
    const justifications = await getJustificationsForRoom(roomId);

    res.status(200).json({
      message: "Vote cast successfully!",
      newTally: updatedTally,
      newJustifications: justifications,
    });
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
      res.status(404).json({ message: "Decision room not null." });
      return; // Stop execution
    }

    if (!isVotingClosed(room.deadline) && room.creatorId !== userId) {
      res.status(403).json({
        message: "You are not authorized to view live tallies for this room.",
      });
      return; // Stop execution
    }

    const tally = await getTallyForRoom(roomId);
    const justifications = await getJustificationsForRoom(roomId);

    res.status(200).json({
      tally,
      votingClosed: isVotingClosed(room.deadline),
      justifications: justifications,
    });
  } catch (error: any) {
    console.error("Error fetching decision tally:", error);
    res
      .status(500)
      .json({ message: "Server error fetching tally.", error: error.message });
  }
};

// Helper function to calculate tally (counts per option)
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

// NEW: Helper function to get vote justifications
const getJustificationsForRoom = async (roomId: string) => {
  const votesWithComments = await prisma.vote.findMany({
    where: {
      decisionRoomId: roomId,
      // Corrected filter for comment: not null AND not empty string
      NOT: [{ comment: null }, { comment: "" }],
    },
    select: {
      id: true, // Unique ID for the vote
      comment: true,
      optionId: true, // Keep optionId to link back to option text easily
      voterId: true,
      User: {
        select: {
          username: true,
          id: true, // include id to show voterId if username not present
        },
      },
      option: {
        // This refers to the 'option Option' relation field in Vote model
        select: {
          text: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc", // Order by oldest comments first
    },
  });

  // Format the justifications for the frontend
  const formattedJustifications = votesWithComments.map((vote) => ({
    voteId: vote.id,
    // Access related data via the selected relation properties
    voterDisplay:
      vote.User?.username || vote.User?.id || vote.voterId || "Anonymous", // Prefer username, fallback to userId, then voterId, then 'Anonymous'
    optionText: vote.option.text,
    comment: vote.comment,
  }));

  return formattedJustifications;
};
