import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { Eye, EyeOff } from "lucide-react";

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const response = await api.post(`${endpoint}`, {
        username,
        password,
      });
      setMessage(response.data.message);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        navigate("/dashboard");
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || "An error occurred.");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-bg p-4">
      <div className="bg-neutral-card p-8 rounded-lg shadow-custom-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">
          Welcome to <span className="text-primary-blue">Consensus</span>
        </h2>
        <div className="flex justify-center mb-6">
          <button
            className={`px-6 py-2 rounded-l-lg text-lg font-semibold transition duration-300 ${
              isLogin
                ? "bg-primary-blue text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`px-6 py-2 rounded-r-lg text-lg font-semibold transition duration-300 ${
              !isLogin
                ? "bg-primary-blue text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-text-secondary text-sm font-medium mb-2"
              htmlFor="username"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              className="shadow-sm appearance-none border border-neutral-border rounded-lg w-full py-2.5 px-4 text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition duration-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              className="block text-text-secondary text-sm font-medium mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="shadow-sm appearance-none border border-neutral-border rounded-lg w-full py-2.5 px-4 pr 10 text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-blue rounded-r-lg"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-primary-blue hover:bg-secondary-indigo text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-opacity-50 transition duration-300 shadow-md"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>
        {message && (
          <p className="mt-5 text-center text-sm text-error-red font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};
