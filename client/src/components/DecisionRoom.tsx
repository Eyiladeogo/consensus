import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";

// Define interfaces for the data structures
interface Option {
  id: string;
  text: string;
}

interface Justification {
  voteId: string;
  voterDisplay: string; // Will be username, userId, or 'Anonymous'
  optionText: string;
  comment: string | null; // Can be null if the comment was an empty string, or undefined if not fetched
}

interface Room {
  id: string;
  title: string;
  explanation: string;
  options: Option[];
  deadline: string;
  creatorId: string;
  isCreator: boolean;
  votingClosed: boolean;
  hasVoted?: boolean;
}

export const DecisionRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voteMessage, setVoteMessage] = useState("");
  const [commentText, setCommentText] = useState("");

  const [tally, setTally] = useState<Record<string, number>>({});
  // NEW: State for justifications
  const [justifications, setJustifications] = useState<Justification[]>([]);

  // Effect to fetch room details
  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!id) {
        setError("Room ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/auth"); // Redirect if not authenticated
          return;
        }

        const response = await api.get<Room>(`/decisions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedRoom = response.data;
        setRoom(fetchedRoom);

        setHasVoted(fetchedRoom.hasVoted || false);

        setSelectedOption(null); // Reset selected option when room loads
        setCommentText(""); // Reset comment text when room loads

        // Fetch initial tally and justifications if voting is closed or user is creator
        if (fetchedRoom.votingClosed || fetchedRoom.isCreator) {
          fetchTallyAndJustifications(fetchedRoom.id);
        }
      } catch (err: any) {
        console.error("Error fetching room details:", err);
        setError(err.response?.data?.message || "Failed to load room details.");
        if (
          err.response?.status === 404 ||
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          navigate("/dashboard");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [id, navigate]);

  // Combined function to fetch tally and justifications
  const fetchTallyAndJustifications = async (roomId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await api.get<{
        tally: Record<string, number>;
        votingClosed: boolean;
        justifications: Justification[];
      }>(`/decisions/${roomId}/tally`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTally(response.data.tally);
      setJustifications(response.data.justifications || []); // Set justifications
    } catch (err: any) {
      console.error("Error fetching tally and justifications:", err);
      // Handle error, e.g., display message
    }
  };

  const handleVote = async () => {
    if (!selectedOption) {
      setVoteMessage("Please select an option to vote.");
      return;
    }
    if (!room) return;

    setVoteMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth");
        return;
      }

      const response = await api.post(
        `decisions/${room.id}/vote`,
        {
          optionId: selectedOption,
          comment: commentText.trim(), // Trim whitespace from comment
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setVoteMessage(response.data.message);
      setHasVoted(true);
      setCommentText(""); // Clear comment after successful vote

      // Update tally and justifications after voting
      if (response.data.newTally && response.data.newJustifications) {
        setTally(response.data.newTally);
        setJustifications(response.data.newJustifications);
      } else {
        fetchTallyAndJustifications(room.id); // Re-fetch if backend doesn't return
      }
    } catch (error: any) {
      setVoteMessage(error.response?.data?.message || "Failed to cast vote.");
    }
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="text-center mt-20 text-xl">Loading room details...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-20 text-xl text-red-600">{error}</div>
    );
  }

  if (!room) {
    return (
      <div className="text-center mt-20 text-xl text-gray-700">
        Room not found.
      </div>
    );
  }

  const votingClosedDisplay = room.votingClosed;

  const sortedTally = Object.entries(tally).sort(
    ([, countA], [, countB]) => countB - countA
  );

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">{room.title}</h1>
        <p className="text-gray-700 mb-6">{room.explanation}</p>

        <p className="text-sm text-gray-600 mb-4">
          Voting Deadline: {new Date(room.deadline).toLocaleString()}
          {votingClosedDisplay && (
            <span className="font-bold text-red-600 ml-2"> (CLOSED)</span>
          )}
        </p>

        <h2 className="text-xl font-semibold mb-3 text-gray-700">Options:</h2>
        <div className="space-y-3 mb-6">
          {room.options.map((option) => (
            <label
              key={option.id}
              className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition duration-150"
            >
              <input
                type="radio"
                name="votingOption"
                value={option.id}
                checked={selectedOption === option.id}
                onChange={() => setSelectedOption(option.id)}
                className="form-radio h-5 w-5 text-blue-600"
                disabled={hasVoted || votingClosedDisplay}
              />
              <span className="ml-3 text-lg text-gray-800">{option.text}</span>
            </label>
          ))}
        </div>

        {!votingClosedDisplay && !hasVoted && (
          <div className="mb-6">
            <label
              htmlFor="comment"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Optional: Justify your vote (anonymous)
            </label>
            <textarea
              id="comment"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={hasVoted}
              placeholder="E.g., 'I chose this option because...'"
            />
          </div>
        )}

        {!votingClosedDisplay && !hasVoted && (
          <button
            onClick={handleVote}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
            disabled={!selectedOption}
          >
            Cast Your Vote
          </button>
        )}

        {hasVoted && !votingClosedDisplay && (
          <p className="text-center text-green-600 font-semibold mb-4">
            Thank you for voting! Your vote has been recorded.
          </p>
        )}

        {voteMessage && (
          <p className="mt-4 text-center text-red-500">{voteMessage}</p>
        )}

        {(votingClosedDisplay || room.isCreator) && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">
              {votingClosedDisplay ? "Final Results" : "Live Tally:"}
            </h2>
            {Object.keys(tally).length === 0 ? (
              <p className="text-gray-600">No votes cast yet.</p>
            ) : (
              <ul className="space-y-2">
                {sortedTally.map(([optionId, count]) => {
                  const optionText =
                    room.options.find((opt) => opt.id === optionId)?.text ||
                    "Unknown Option";
                  return (
                    <li
                      key={optionId}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                    >
                      <span className="text-gray-800">{optionText}</span>
                      <span className="text-blue-600 font-bold">
                        {count} votes
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* NEW: Display Justifications Section */}
            {justifications.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold mb-3 text-gray-700">
                  Justifications:
                </h2>
                <ul className="space-y-3">
                  {justifications.map((justify) => (
                    <li
                      key={justify.voteId}
                      className="bg-blue-50 p-4 rounded-lg shadow-sm"
                    >
                      <p className="text-sm text-gray-800 font-medium mb-1">
                        <span className="font-semibold text-blue-800">
                          {justify.voterDisplay}
                        </span>{" "}
                        voted for{" "}
                        <span className="font-bold text-blue-700">
                          "{justify.optionText}"
                        </span>
                      </p>
                      <p className="text-gray-700 text-sm italic">
                        "{justify.comment}"
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
