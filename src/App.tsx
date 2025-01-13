import React, { useEffect, useState } from "react";
import { FileExplorer } from "./components/FileExplorer";
import { StepsList } from "./components/StepsList";
import { CodeEditor } from "./components/CodeEditor";
import { FileStructure, Step } from "./types";
import { Send } from "lucide-react";
import axios from "axios";
import { WebContainer } from "@webcontainer/api";
import output from "./sample_output";
import { v4 as uuid } from "uuid";
import { Eye } from "lucide-react";
import { Prompts } from "./interfaces/prompts";
import { DEFAULT_CONTENT } from "./utils/constants";

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

  function parseFileStructure(input: string): FileStructure[] {
    // Replace \n in the input string with actual newlines
    const normalizedInput = input.replace(/\\n/g, "\n");

    // Regex to match <boltAction type="file" filePath="..."> ... </boltAction>
    const regex =
      /<boltAction[^>]+type="file"[^>]*filePath="([^"]+)"[^>]*>([\s\S]*?)<\/boltAction>/g;
    const filePaths: { path: string; content: string }[] = [];

    let match;
    while ((match = regex.exec(normalizedInput)) !== null) {
      const path = match[1]; // File path
      const content = match[2].trim(); // File content
      filePaths.push({ path, content });
    }

    const buildStructure = (
      paths: { path: string; content: string }[]
    ): FileStructure[] => {
      const root: FileStructure[] = [];

      paths.forEach(({ path, content }) => {
        const parts = path.split("/"); // Split the file path by '/'
        let currentLevel = root;
        parts.forEach((part, index) => {
          let existing = currentLevel.find((item) => item.name === part);

          if (!existing) {
            if (index === parts.length - 1) {
              // Create a file
              existing = {
                name: part,
                type: "file",
                content,
                path: path,
              };
            } else {
              // Create a folder
              existing = {
                name: part,
                type: "folder",
                children: [],
                // path: currentLevel.join("/") + part,
              };
            }
            currentLevel.push(existing);
          }

          if (existing.type === "folder") {
            currentLevel = existing.children!;
          }
        });
      });

      return root;
    };

    return buildStructure(filePaths);
  }

  const convertFileStructureToContent = (
    fileStructure: FileStructure[]
  ): Record<string, any> => {
    const content: Record<string, any> = {};

    const traverse = (items: FileStructure[]): Record<string, any> => {
      const result: Record<string, any> = {};
      items.forEach((item) => {
        if (item.type === "file" && item.content) {
          // Add file structure
          result[item.name] = { file: { contents: item.content } };
        } else if (item.type === "folder" && item.children) {
          // Add folder structure
          result[item.name] = { directory: traverse(item.children) };
        }
      });
      return result;
    };

    Object.assign(content, traverse(fileStructure));
    return content;
  };

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
    const res = convertFileStructureToContent(fileStructure);
    setContentToTransfer(res);
    setMockFileStructure(fileStructure);
  }, [queryResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBuilding(true);

    // const res = await axios.get("http://127.0.0.1:3000/initial-prompts", {
    //   params: {
    //     prompt: query,
    //   },
    // });
    // setTechStack(res.data.techStack);
    // const prompts: string[] = [
    //   ...res.data.prompts,
    //   ...res.data.uiPrompts,
    //   query,
    // ];
    // const promptsToSend: Prompts[] = prompts.map((prompt) => {
    //   return { message: prompt, role: "user" };
    // });
    // const response = await axios.post("http://127.0.0.1:3000/chat", {
    //   messages: promptsToSend,
    // });
    // promptsToSend.push({ message: response.data, role: "assistant" });
    // setPrompts(promptsToSend);

    // setQueryResponse(response.data);
    setQueryResponse(output);
  };

  useEffect(() => {
    const main = async () => {
      if (webcontainerInstance === undefined) {
        const container = await WebContainer.boot();
        setContainer(container);
      }
    };
    main();
  }, []);

  useEffect(() => {
    const main = async () => {
      if (webcontainerInstance && contentToTransfer) {
        setSource("");
        await webcontainerInstance.mount(contentToTransfer);
        // Install dependencies
        const installProcess = await webcontainerInstance.spawn("npm", [
          "install",
        ]);
        await installProcess.exit;

        await webcontainerInstance.spawn("npm", ["install", "autoprefixer"]);

        // Start development server
        const devProcess = await webcontainerInstance.spawn("npm", [
          "run",
          "dev",
        ]);
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log(`[Dev Output]: ${data.toString()}`);
            },
            abort(err) {
              console.error(`[Dev Error]: ${new TextDecoder().decode(err)}`);
            },
          })
        );

        // Handle server ready event
        webcontainerInstance.on("server-ready", (port, url) => {
          console.log(`Server is ready on ${url}`);
          setSource(url);
        });
      }
    };
    main();
  }, [contentToTransfer]);

  const handlePreview = async () => {
    setShowPreview(!showPreview);
  };

  if (!isBuilding) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            Website Builder
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
    <div className="relative">
      <button
        onClick={handlePreview}
        className="flex items-center px-3 py-1 bg-black text-white rounded-2xl absolute right-5 m-1 text-sm"
      >
        <div
          className={`px-3 py-0.5 rounded-2xl m-0.5 hover:bg-blue-700 transition-colors ${
            !showPreview ? "bg-blue-600" : ""
          }`}
        >
          Code
        </div>
        <div
          className={`rounded-2xl m-0.5 px-3 py-0.5 hover:bg-blue-700 transition-colors ${
            showPreview ? "bg-blue-600" : ""
          }`}
        >
          Preview
        </div>
      </button>
      <div className="min-h-screen bg-gray-900 text-white flex">
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
            onFileSelect={setSelectedContent}
            content={selectedContent}
            showPreview={showPreview}
            source={source}
            loadingForUpdate={loadingForUpdate}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
