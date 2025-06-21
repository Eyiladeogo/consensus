import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { PlusCircle, MinusCircle } from "lucide-react";

export const CreateRoom: React.FC = () => {
  const [title, setTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [options, setOptions] = useState(["", ""]); // Start with 2 options
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
      setMessage(""); // Clear message if new option is added successfully
    } else {
      setMessage("You can have a maximum of 5 options.");
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      setMessage(""); // Clear message if option is removed successfully
    } else {
      setMessage("You must have at least 2 options.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth");
        return;
      }
      const validOptions = options.filter((opt) => opt.trim() !== "");
      if (validOptions.length < 2) {
        setMessage("Please provide at least two options.");
        return;
      }

      // Format deadline to ISO string for backend
      const response = await api.post(`decisions/`, {
        title,
        explanation,
        options: validOptions,
        deadline: new Date(deadline).toISOString(), // Ensure ISO string for backend
      });
      setMessage(response.data.message);
      navigate("/dashboard");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "An error occurred during room creation."
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-bg p-4 md:p-8">
      <div className="bg-neutral-card p-6 md:p-10 rounded-lg shadow-custom-lg w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">
          Create New Decision Room
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className="block text-text-secondary text-base font-medium mb-2"
              htmlFor="title"
            >
              Decision Title
            </label>
            <input
              type="text"
              id="title"
              className="shadow-sm appearance-none border border-neutral-border rounded-lg w-full py-2.5 px-4 text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition duration-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Next Team Lunch Location"
              required
            />
          </div>
          <div>
            <label
              className="block text-text-secondary text-base font-medium mb-2"
              htmlFor="explanation"
            >
              Explanation
            </label>
            <textarea
              id="explanation"
              className="shadow-sm appearance-none border border-neutral-border rounded-lg w-full py-2.5 px-4 text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition duration-200"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={4}
              placeholder="Provide a detailed explanation for the decision..."
              required
            />
          </div>
          <div>
            <label className="block text-text-secondary text-base font-medium mb-3">
              Options (2-5)
            </label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center mb-3">
                <input
                  type="text"
                  className="shadow-sm appearance-none border border-neutral-border rounded-lg w-full py-2.5 px-4 text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent mr-3 transition duration-200"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-2 text-error-red hover:text-red-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-error-red rounded-full"
                    aria-label={`Remove option ${index + 1}`}
                  >
                    <MinusCircle className="w-6 h-6" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center text-primary-blue hover:text-secondary-indigo font-medium py-2 transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary-blue rounded-md"
              >
                <PlusCircle className="w-5 h-5 mr-1" />
                <span>Add Option</span>
              </button>
            )}
          </div>
          <div>
            <label
              className="block text-text-secondary text-base font-medium mb-2"
              htmlFor="deadline"
            >
              Voting Deadline
            </label>
            <input
              type="date"
              id="deadline"
              className="shadow-sm appearance-none border border-neutral-border rounded-lg w-full py-2.5 px-4 text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition duration-200"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-success-green hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-green focus:ring-opacity-50 transition duration-300 shadow-md"
          >
            Create Room
          </button>
        </form>
        {message && (
          <p className="mt-5 text-center text-sm font-medium text-error-red">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};
