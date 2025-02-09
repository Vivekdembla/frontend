import React, { useEffect, useState } from "react";
import { FileExplorer } from "./components/FileExplorer";
import { StepsList } from "./components/StepsList";
import { FileStructure, Step } from "./types";
import { Download, Send } from "lucide-react";
import axios from "axios";
import { WebContainer } from "@webcontainer/api";
import { v4 as uuid } from "uuid";
import { Eye, Code2 } from "lucide-react";
import { Prompts } from "./interfaces/prompts";
import { BACKEND_URL, DEFAULT_CONTENT } from "./utils/constants";
import {
  convertFileStructureToContent,
  downloadZip,
  parseFileStructure,
  renderCode,
} from "./utils/helper";
import { Button, Card } from "@mui/material";

function App() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [queryResponse, setQueryResponse] = useState<string>("");
  const [query, setQuery] = useState("");
  const [selectedContent, setSelectedContent] = useState<FileStructure>({
    name: "",
    type: "file",
    content: DEFAULT_CONTENT,
  });
  const [contentToTransfer, setContentToTransfer] = useState({});
  const [source, setSource] = useState("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [webcontainerInstance, setContainer] = useState<WebContainer>();
  const [mockSteps, setMockSteps] = useState<Step[]>([]);
  const [mockFileStructure, setMockFileStructure] = useState<FileStructure[]>(
    []
  );
  const [prompts, setPrompts] = useState<Prompts[]>([]);
  const [loadingForUpdate, setLoadingForUpdate] = useState<boolean>(false);
  const [techStack, setTechStack] = useState<string>("");

  const setSteps = () => {
    const steps: Step[] = [];
    const regex =
      /<boltAction[^>]+type="([^"]+)"(?:[^>]*filePath="([^"]+)")?[^>]*>\s*([\s\S]*?)\s*<\/boltAction>/g;
    let match;

    while ((match = regex.exec(queryResponse)) !== null) {
      const [_, type, filePath, content] = match;
      if (type === "shell") {
        steps.push({
          id: uuid(),
          title: `Run "${content.trim()}"`,
          status: "completed",
          description: "Running the command...",
        });
      } else if (type === "file" && filePath) {
        steps.push({
          id: uuid(),
          title: `Create "${filePath}"`,
          status: "completed",
          description: "Creating the file...",
        });
      }
    }
    setMockSteps(steps);
  };

  useEffect(() => {
    setSteps();
    const fileStructure = parseFileStructure(queryResponse);
    // const res = convertFileStructureToContent(fileStructure);
    // setContentToTransfer(res);
    setMockFileStructure([...fileStructure]);
  }, [queryResponse]);

  useEffect(() => {
    if (mockFileStructure.length > 0) {
      const res = convertFileStructureToContent(mockFileStructure);
      setContentToTransfer(res);
    }
  }, [mockFileStructure]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBuilding(true);

    const res = await axios.get(`${BACKEND_URL}/initial-prompts`, {
      params: {
        prompt: query,
      },
    });
    setTechStack(res.data.techStack);
    const prompts: string[] = [
      ...res.data.prompts,
      ...res.data.uiPrompts,
      query,
    ];
    const promptsToSend: Prompts[] = prompts.map((prompt) => {
      return { message: prompt, role: "user" };
    });
    const response = await axios.post(`${BACKEND_URL}/chat`, {
      messages: promptsToSend,
    });
    promptsToSend.push({ message: response.data, role: "assistant" });
    setPrompts(promptsToSend);

    setQueryResponse(response.data);
  };

  useEffect(() => {
    const main = async () => {
      if (!webcontainerInstance) {
        const container = await WebContainer.boot();
        setContainer(container);
      }
    };
    main();
  }, []);

  useEffect(() => {
    renderCode(webcontainerInstance, contentToTransfer, setSource);
  }, [contentToTransfer]);

  const handlePreview = async () => {
    setShowPreview(!showPreview);
  };

  if (!isBuilding) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-4xl font-bold text-white mb-8 text-center font-mono">
            builder.AI
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-32 px-4 py-3 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder="Describe the website you want to build..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                disabled={query.trim() === ""}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-900">
      <div className="h-[6vh] border-b-2 border-gray-700 flex justify-between p-4">
        <h1 className="self-center text-white text-3xl font-medium font-mono">
          builder.AI
        </h1>
        <Button
          variant="contained"
          size="small"
          className=" self-center h-[4vh]"
          style={{
            color: "white",
            gap: 10,
            borderRadius: "1rem",
            backgroundColor: "#030712",
            fontWeight: "bold",
          }}
          onClick={() => {
            downloadZip(mockFileStructure);
          }}
        >
          Download
          <Download />
        </Button>
      </div>
      <button
        onClick={handlePreview}
        className="flex items-center px-[2vh] bg-gray-950 text-white rounded-2xl absolute right-5 m-[2.7vh] text-sm h-[4vh]"
      >
        <div
          className={` px-2 mx-0.5 rounded-2xl hover:bg-blue-700 transition-colors ${
            !showPreview ? "bg-blue-600" : ""
          }`}
        >
          <Code2 height="3vh" />
        </div>
        <div
          className={`rounded-2xl mx-0.5 px-2 py-0.5 hover:bg-blue-700 transition-colors ${
            showPreview ? "bg-blue-600" : ""
          }`}
        >
          <Eye height="3vh" />
        </div>
      </button>
      <Card
        className="m-[2vh] border-gray-400 border-2"
        sx={{ borderRadius: "1rem", boxShadow: 10 }}
      >
        <div className="min-h-screen text-white flex">
          <div className="w-1/2 border-r border-gray-700">
            <StepsList
              steps={mockSteps}
              prompts={prompts}
              setPrompts={setPrompts}
              setQueryResponse={setQueryResponse}
              loadingForUpdate={loadingForUpdate}
              setLoadingForUpdate={setLoadingForUpdate}
            />
          </div>
          <div className="w-full border-r border-gray-700 ">
            <FileExplorer
              structure={mockFileStructure}
              setStructure={setMockFileStructure}
              onFileSelect={setSelectedContent}
              file={selectedContent}
              showPreview={showPreview}
              source={source}
              loadingForUpdate={loadingForUpdate}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default App;
