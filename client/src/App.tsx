import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Dashboard } from "./components/Dashboard";
import { AuthPage } from "./components/AuthPage";
import { CreateRoom } from "./components/CreateRoom";
import { DecisionRoom } from "./components/DecisionRoom";
import { Navbar } from "./components/Navbar"; // NEW: Import Navbar

// Main App Component with Router
const App: React.FC = () => {
  // Define the app name centrally
  const appName = "Consensus";

  return (
    <Router>
      <div className="font-sans min-h-screen flex flex-col">
        {/* The Navbar will appear on all pages except the authentication page */}
        <Routes>
          <Route path="/auth" element={<></>} /> {/* No Navbar on AuthPage */}
          <Route path="/" element={<></>} />{" "}
          {/* No Navbar on default AuthPage route */}
          <Route path="*" element={<Navbar appName={appName} />} />{" "}
          {/* Navbar for all other routes */}
        </Routes>

        {/* Main content area */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-room" element={<CreateRoom />} />
            <Route path="/room/:id" element={<DecisionRoom />} />
            {/* Add a 404 route for unknown paths */}
            <Route
              path="*"
              element={
                <p className="text-center mt-20 text-xl text-gray-700">
                  404: Page Not Found
                </p>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
