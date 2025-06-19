import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserCircle, LogOut } from "lucide-react"; // Import Lucide React icons

interface NavbarProps {
  appName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ appName }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <nav className="bg-gradient-to-r from-primary-blue to-secondary-indigo p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* App Logo/Name */}
        <Link
          to="/dashboard"
          className="text-white text-2xl font-bold tracking-wide"
        >
          {appName}
        </Link>

        {/* Navigation Links and User Icon */}
        <div className="flex items-center space-x-6">
          <Link
            to="/dashboard"
            className="text-white text-lg font-medium hover:text-blue-200 transition duration-200"
          >
            Rooms
          </Link>

          {/* User Profile Icon with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="focus:outline-none p-1 rounded-full hover:bg-blue-700 transition duration-200"
              aria-label="User menu"
            >
              {/* Using Lucide React UserCircle as the default SVG icon */}
              <UserCircle className="w-8 h-8 text-white" />
            </button>

            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl py-1 z-10"
                onMouseLeave={() => setIsDropdownOpen(false)} // Close dropdown on mouse leave
              >
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center space-x-2 transition duration-150 rounded-md"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
