import React, { useState } from "react";
import { CheckCircle, Circle, AlertCircle, Loader, Send } from "lucide-react";
import { Step } from "../types";
import { Prompts } from "../interfaces/prompts";
import { CircularProgress, Skeleton } from "@mui/material";
import axios from "axios";

interface StepsListProps {
  steps: Step[];
  prompts: Prompts[];
  setPrompts: (prompts: Prompts[]) => void;
  setQueryResponse: (response: string) => void;
  loadingForUpdate: boolean;
  setLoadingForUpdate: (loading: boolean) => void;
}

const StepIcon = ({ status }: { status: Step["status"] }) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="text-green-500" size={20} />;
    case "processing":
      return <Loader className="text-blue-500 animate-spin" size={20} />;
    case "error":
      return <AlertCircle className="text-red-500" size={20} />;
    default:
      return <Circle className="text-gray-500" size={20} />;
  }
};

export const StepsList: React.FC<StepsListProps> = ({
  steps,
  prompts,
  setPrompts,
  setQueryResponse,
  setLoadingForUpdate,
  loadingForUpdate,
}) => {
  const [message, setMessage] = useState<string>("");
  const handleChat = async (e: any) => {
    e.preventDefault();
    try {
      const promptsToSend = prompts.map((prompt) => ({
        message: prompt.message,
        role: prompt.role,
      }));
      promptsToSend.push({
        message,
        role: "user",
      });
      setMessage("");
      setLoadingForUpdate(true);
      const response = await axios.post("http://127.0.0.1:3000/chat", {
        messages: promptsToSend,
      });
      setQueryResponse(response.data);
      promptsToSend.push({ message: response.data, role: "assistant" });
      setPrompts(promptsToSend);
    } catch (error) {
      console.error("Error sending chat message:", error);
    } finally {
      setLoadingForUpdate(false);
    }
  };
  return (
    <div className="h-full bg-gray-900 border-r border-gray-700 flex flex-col justify-between">
      {steps.length == 0 ? (
        <div>
          <div className="p-2 border-b border-gray-700 h-[6vh] flex items-center">
            <h2 className="text-gray-300 font-semibold">Build Steps</h2>
          </div>
          <div className="p-4">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="mb-4 flex items-start">
                <div className="mr-3 mt-1">
                  <Skeleton
                    animation="wave"
                    variant="circular"
                    width={40}
                    height={40}
                  />
                </div>
                <div className="w-full">
                  <Skeleton
                    animation="wave"
                    height={20}
                    width="90%"
                    style={{ marginBottom: 6 }}
                  />
                  <Skeleton
                    animation="wave"
                    height={20}
                    width="50%"
                    style={{ marginBottom: 6 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div>
            <div className="p-2 border-b border-gray-700 h-[6vh] flex items-center">
              <h2 className="text-gray-300 font-semibold">Build Steps</h2>
            </div>
            <div className="p-4">
              {steps.map((step) => (
                <div key={step.id} className="mb-4 flex items-start">
                  <div className="mr-3 mt-1">
                    <StepIcon status={step.status} />
                  </div>
                  <div>
                    <h3 className="text-gray-300 font-medium">{step.title}</h3>
                    <p className="text-gray-500 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-2">
            <form onSubmit={handleChat} className="space-y-4">
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-32 px-4 py-3 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  placeholder="How can we help you?"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault(); // Prevent newline in the TextField
                      handleChat(e); // Trigger form submission
                    }
                  }}
                  name="message"
                />
                {loadingForUpdate ? (
                  <div className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 px-3 rounded-full hover:bg-blue-700 transition-colors justify-center flex">
                    <CircularProgress size="20px" color="inherit" />
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                    disabled={message.trim() === ""}
                  >
                    <Send size={20} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
