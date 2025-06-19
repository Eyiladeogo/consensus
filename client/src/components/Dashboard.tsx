import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

interface DecisionRoom {
  id: string;
  title: string;
  deadline: string;
  // Add other properties if needed for display on dashboard
}

export const Dashboard: React.FC = () => {
  const [decisionRooms, setDecisionRooms] = useState<DecisionRoom[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDecisionRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/auth"); // Redirect to login if not authenticated
          return;
        }
        const response = await api.get<DecisionRoom[]>(`decisions/`);
        // Sort rooms by deadline, closest first, then by creation date
        const sortedRooms = response.data.sort((a, b) => {
          const deadlineA = new Date(a.deadline).getTime();
          const deadlineB = new Date(b.deadline).getTime();
          return deadlineA - deadlineB; // Sort by deadline ascending
        });
        setDecisionRooms(sortedRooms);
      } catch (error: any) {
        console.error("Error fetching decision rooms:", error);
        // Handle token expiration or invalid token
        localStorage.removeItem("token");
        navigate("/auth");
      }
    };
    fetchDecisionRooms();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <div className="container mx-auto p-6 md:p-8 bg-neutral-bg min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-text-primary">
          Your Dashboard
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate("/create-room")}
            className="flex items-center px-6 py-3 bg-success-green hover:bg-green-600 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            {/* Plus icon from Lucide React or similar could go here */}
            <span>Create New Room</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center px-6 py-3 bg-error-red hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            {/* Logout icon from Lucide React or similar could go here */}
            <span>Logout</span>
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-text-secondary">
        Your Decision Rooms
      </h2>
      {decisionRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-neutral-card p-12 rounded-lg shadow-md text-text-secondary">
          <p className="text-xl font-medium mb-4">
            No decision rooms created yet.
          </p>
          <p className="text-lg">Click "Create New Room" to get started!</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decisionRooms.map((room) => (
            <li
              key={room.id}
              className="bg-neutral-card p-6 rounded-lg shadow-custom-md border border-neutral-border hover:shadow-custom-lg transition duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-text-primary mb-2">
                  {room.title}
                </h3>
                <p className="text-text-secondary text-sm mb-4">
                  Deadline:{" "}
                  <span className="font-medium">
                    {/* CHANGED: Displaying date in UTC */}
                    {new Date(room.deadline).toUTCString()} (UTC)
                  </span>
                </p>
              </div>
              <Link
                to={`/room/${room.id}`}
                className="mt-4 inline-block self-start px-5 py-2 bg-primary-blue hover:bg-secondary-indigo text-white font-medium rounded-md shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-opacity-50"
              >
                View Room
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
