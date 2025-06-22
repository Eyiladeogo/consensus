import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { Loader2 } from "lucide-react";

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
      setJustifications(response.data.justifications || []);
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
          comment: commentText.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setVoteMessage(response.data.message);
      setHasVoted(true);
      setCommentText("");

      if (response.data.newTally && response.data.newJustifications) {
        setTally(response.data.newTally);
        setJustifications(response.data.newJustifications);
      } else {
        fetchTallyAndJustifications(room.id);
      }
    } catch (error: any) {
      setVoteMessage(error.response?.data?.message || "Failed to cast vote.");
    }
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-neutral-bg">
        <Loader2 className="animate-spin text-primary-blue h-10 w-10" />
        <p className="ml-3 text-xl text-text-secondary">
          Loading room details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-neutral-bg">
        <p className="text-center text-xl text-error-red p-4 rounded-lg bg-neutral-card shadow-md">
          {error}
        </p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-neutral-bg">
        <p className="text-center text-xl text-text-secondary p-4 rounded-lg bg-neutral-card shadow-md">
          Room not found.
        </p>
      </div>
    );
  }

  const votingClosedDisplay = room.votingClosed;

  // Sort tally by count in descending order
  const sortedTally = Object.entries(tally).sort(
    ([, countA], [, countB]) => countB - countA
  );

  return (
    <div className="container mx-auto p-6 md:p-8 bg-neutral-bg min-h-screen">
      <div className="bg-neutral-card p-6 md:p-10 rounded-lg shadow-custom-lg border border-neutral-border">
        {/* Room Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 pb-4 border-b border-neutral-border">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-2">
              {room.title}
            </h1>
            <p className="text-text-secondary text-lg mb-4 leading-relaxed">
              {room.explanation}
            </p>
          </div>
          <div className="md:ml-6 mt-4 md:mt-0 text-right md:w-1/3">
            <p className="text-text-secondary text-sm font-medium">
              Voting Deadline:
            </p>
            <p className="text-lg font-semibold text-text-primary">
              {/* CHANGED: Displaying date in UTC */}
              {new Date(room.deadline).toUTCString()} (UTC)
            </p>
            {votingClosedDisplay && (
              <span className="font-bold text-error-red ml-2"> (CLOSED)</span>
            )}
          </div>
        </div>

        {/* Options Section */}
        <h2 className="text-2xl font-bold text-text-primary mb-5">Options:</h2>
        <div className="grid grid-cols-1 gap-4 mb-6">
          {room.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition duration-200 ease-in-out
                ${
                  selectedOption === option.id
                    ? "bg-primary-blue bg-opacity-10 border-primary-blue shadow-custom-sm"
                    : "bg-neutral-card border-neutral-border hover:bg-neutral-bg hover:border-text-accent-blue"
                }
                ${
                  hasVoted || votingClosedDisplay
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }
              `}
            >
              <input
                type="radio"
                name="votingOption"
                value={option.id}
                checked={selectedOption === option.id}
                onChange={() => setSelectedOption(option.id)}
                className="form-radio h-5 w-5 text-primary-blue focus:ring-primary-blue disabled:opacity-50"
                disabled={hasVoted || votingClosedDisplay}
              />
              <span className="ml-4 text-lg text-text-primary font-medium">
                {option.text}
              </span>
            </label>
          ))}
        </div>

        {/* Optional Justification Textarea and Vote Button */}
        {!votingClosedDisplay && !hasVoted && (
          <div className="mb-6 bg-neutral-bg p-6 rounded-lg border border-neutral-border shadow-inner">
            <label
              htmlFor="comment"
              className="block text-text-secondary text-base font-medium mb-2"
            >
              Optional: Justify your vote
            </label>
            <textarea
              id="comment"
              className="shadow-sm appearance-none border border-neutral-border rounded-lg w-full py-2.5 px-4 text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition duration-200 resize-y"
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={hasVoted}
              placeholder="Share your anonymous thoughts on why you chose this option..."
            />
          </div>
        )}

        {!votingClosedDisplay && !hasVoted && (
          <button
            onClick={handleVote}
            className="w-full bg-primary-blue hover:bg-secondary-indigo text-white font-bold py-3.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-opacity-50 transition duration-300 shadow-md transform hover:-translate-y-0.5 disabled:bg-gray-400 disabled:shadow-none disabled:transform-none"
            disabled={!selectedOption}
          >
            Cast Your Vote
          </button>
        )}

        {/* Feedback Messages */}
        {hasVoted && !votingClosedDisplay && (
          <p className="mt-6 text-center text-success-green font-semibold text-lg animate-pulse">
            Thank you for voting! Your vote has been recorded.
          </p>
        )}

        {voteMessage && (
          <p className="mt-6 text-center text-error-red font-medium text-base">
            {voteMessage}
          </p>
        )}

        {/* Tally and Justifications Section */}
        {(votingClosedDisplay || room.isCreator) && (
          <div className="mt-10 pt-8 border-t-2 border-neutral-border">
            <h2 className="text-2xl font-bold text-text-primary mb-5">
              {votingClosedDisplay ? "Final Results" : "Live Tally"}
            </h2>
            {Object.keys(tally).length === 0 ? (
              <p className="text-text-secondary italic text-lg text-center">
                No votes cast yet.
              </p>
            ) : (
              <ul className="space-y-3 mb-8">
                {sortedTally.map(([optionId, count]) => {
                  const optionText =
                    room.options.find((opt) => opt.id === optionId)?.text ||
                    "Unknown Option";
                  // Calculate percentage for potential future use or visual bars
                  const totalVotes = Object.values(tally).reduce(
                    (sum, current) => sum + current,
                    0
                  );
                  const percentage =
                    totalVotes > 0
                      ? ((count / totalVotes) * 100).toFixed(0)
                      : 0;

                  return (
                    <li
                      key={optionId}
                      className="bg-neutral-bg p-4 rounded-lg shadow-sm flex justify-between items-center border border-neutral-border"
                    >
                      <span className="text-text-primary text-lg font-medium">
                        {optionText}
                      </span>
                      <span className="text-primary-blue font-bold text-xl">
                        {count} votes ({percentage}%)
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Justifications Section */}
            {justifications.length > 0 && (
              <div className="mt-8 pt-6 border-t border-neutral-border">
                <h2 className="text-2xl font-bold text-text-primary mb-5">
                  Justifications
                </h2>
                <ul className="space-y-4">
                  {justifications.map((justify) => (
                    <li
                      key={justify.voteId}
                      className="bg-neutral-bg p-5 rounded-lg shadow-custom-sm border border-neutral-border"
                    >
                      <p className="text-text-secondary text-sm font-medium mb-2">
                        <span className="font-semibold text-text-primary">
                          {justify.voterDisplay}
                        </span>{" "}
                        voted for{" "}
                        <span className="font-bold text-primary-blue">
                          "{justify.optionText}"
                        </span>
                      </p>
                      <p className="text-text-primary text-base italic leading-relaxed">
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
