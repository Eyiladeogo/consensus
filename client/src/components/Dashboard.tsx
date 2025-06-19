import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

export const Dashboard: React.FC = () => {
  const [decisionRooms, setDecisionRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDecisionRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/auth"); // Redirect to login if not authenticated
          return;
        }
        const response = await api.get(`decisions/`);
        setDecisionRooms(response.data);
      } catch (error) {
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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Dashboard</h1>
      <button
        onClick={() => navigate("/create-room")}
        className="mb-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
      >
        Create New Decision Room
      </button>
      <button
        onClick={handleLogout}
        className="ml-4 mb-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
      >
        Logout
      </button>
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">
        Your Decision Rooms
      </h2>
      {decisionRooms.length === 0 ? (
        <p className="text-gray-600">No decision rooms created yet.</p>
      ) : (
        <ul className="space-y-4">
          {decisionRooms.map((room: any) => (
            <li
              key={room.id}
              className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {room.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  Deadline: {new Date(room.deadline).toLocaleDateString()}
                </p>
              </div>
              <Link
                to={`/room/${room.id}`}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
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
