import React, { useEffect, useState } from 'react';
import { FileExplorer } from './components/FileExplorer';
import { StepsList } from './components/StepsList';
import { CodeEditor } from './components/CodeEditor';
import { FileStructure, Step } from './types';
import { Send } from 'lucide-react';
import axios from 'axios';

function App() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [queryResponse, setQueryResponse] = useState<string>("");
  const [query, setQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState('');

  const [mockSteps, setMockSteps] = useState<Step[]>([
    {
      id: 1,
      title: 'Analyzing Requirements',
      status: 'completed',
      description: 'Processing your website requirements',
    },
    {
      id: 2,
      title: 'Generating Structure',
      status: 'processing',
      description: 'Creating file structure and components',
    },
    {
      id: 3,
      title: 'Installing Dependencies',
      status: 'pending',
      description: 'Setting up required packages',
    },
  ]);

  const [mockFileStructure, setMockFileStructure] = useState<FileStructure[]>([
    {
      name: 'src',
      type: 'folder',
      children: [
        {
          name: 'components',
          type: 'folder',
          children: [
            {
              name: 'Header.tsx',
              type: 'file',
              content: '// Header component code here',
            },
          ],
        },
        {
          name: 'App.tsx',
          type: 'file',
          content: '// App component code here',
        },
      ],
    },
  ]);

  function parseFileStructure(input: string): FileStructure[] {
    // Replace \n in the input string with actual newlines
    const normalizedInput = input.replace(/\\n/g, '\n');

    // Regex to match <boltAction type="file" filePath="..."> ... </boltAction>
    const regex = /<boltAction[^>]+type="file"[^>]*filePath="([^"]+)"[^>]*>([\s\S]*?)<\/boltAction>/g;
    const filePaths: { path: string; content: string }[] = [];

    let match;
    while ((match = regex.exec(normalizedInput)) !== null) {
      const path = match[1]; // File path
      const content = match[2].trim(); // File content
      filePaths.push({ path, content });
    }

    const buildStructure = (paths: { path: string; content: string }[]): FileStructure[] => {
      const root: FileStructure[] = [];

      paths.forEach(({ path, content }) => {
        const parts = path.split('/'); // Split the file path by '/'
        let currentLevel = root;

        parts.forEach((part, index) => {
          let existing = currentLevel.find((item) => item.name === part);

          if (!existing) {
            if (index === parts.length - 1) {
              // Create a file
              existing = { name: part, type: 'file', content };
            } else {
              // Create a folder
              existing = { name: part, type: 'folder', children: [] };
            }
            currentLevel.push(existing);
          }

          if (existing.type === 'folder') {
            currentLevel = existing.children!;
          }
        });
      });

      return root;
    };

    return buildStructure(filePaths);
  }

  useEffect(() => {
    const steps: Step[] = [];
    const regex = /<boltAction[^>]+type="([^"]+)"(?:[^>]*filePath="([^"]+)")?[^>]*>\s*([\s\S]*?)\s*<\/boltAction>/g;
    let match;

    while ((match = regex.exec(queryResponse)) !== null) {
      let index = 0;
      const [_, type, filePath, content] = match;
      if (type === "shell") {
        steps.push({
          id: index++,
          title: `Run "${content.trim()}"`, // Run step for shell type
          status: "completed",
          description: "Running the command...",
        })
      } else if (type === "file" && filePath) {
        steps.push({
          id: index++,
          title: `Create "${filePath}"`, // Create step for file type
          status: "completed",
          description: "Creating the file...",
        })
      }
    }
    setMockSteps(steps);

    const fileStructure = parseFileStructure(queryResponse);

    console.log(fileStructure, 'fileStructure');

    setMockFileStructure(fileStructure);

  }, [queryResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBuilding(true);

    const res = await axios.get('http://127.0.0.1:3000/initial-prompts', {
      params: {
        prompt: query
      }
    })
    const promptsToSend: string[] = [...res.data.prompts, ...res.data.uiPrompts];

    const response = await axios.get('http://127.0.0.1:3000/chat', {
      params: { messages: [...promptsToSend, query] }
    })
    console.log(response.data, 'final data');
    setQueryResponse(response.data);
  };

  const handlePreview = () => {
    // Handle preview logic
    console.log('Preview clicked');
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
              />
              <button
                type="submit"
                className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gray-900 text-white flex">
      <div className="w-1/4 border-r border-gray-700">
        <StepsList steps={mockSteps} />
      </div>
      <div className="w-1/4 border-r border-gray-700">
        <FileExplorer
          structure={mockFileStructure}
          onFileSelect={setSelectedContent}
        />
      </div>
      <div className="w-1/2">
        <CodeEditor
          content={selectedContent || 'Select a file to view its contents'}
          onPreviewClick={handlePreview}
        />
      </div>
    </div>
  );
}

export default App;