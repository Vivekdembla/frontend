import React, { useEffect, useState } from 'react';
import { FileExplorer } from './components/FileExplorer';
import { StepsList } from './components/StepsList';
import { CodeEditor } from './components/CodeEditor';
import { FileStructure, Step } from './types';
import { Send } from 'lucide-react';
import axios from 'axios';
import { WebContainer } from '@webcontainer/api';
import output from './sample_output';
import { v4 as uuid } from 'uuid';
import { Eye } from 'lucide-react';

interface Prompts {
  message: string;
  role: string;
}

function App() {
  const [isBuilding, setIsBuilding] = useState(true);
  const [queryResponse, setQueryResponse] = useState<string>("");
  const [query, setQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState('');
  const [contentToTransfer, setContentToTransfer] = useState({});
  const [source, setSource] = useState('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [webcontainerInstance, setContainer] = useState<WebContainer>();
  const [mockSteps, setMockSteps] = useState<Step[]>([]);
  const [mockFileStructure, setMockFileStructure] = useState<FileStructure[]>([]);
  const [prompts, setPrompts] = useState<Prompts[]>([])

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

  const convertFileStructureToContent = (
    fileStructure: FileStructure[]
  ): Record<string, any> => {
    const content: Record<string, any> = {};

    const traverse = (items: FileStructure[]): Record<string, any> => {
      const result: Record<string, any> = {};
      items.forEach((item) => {
        if (item.type === 'file' && item.content) {
          // Add file structure
          result[item.name] = { file: { contents: item.content } };
        } else if (item.type === 'folder' && item.children) {
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
    const regex = /<boltAction[^>]+type="([^"]+)"(?:[^>]*filePath="([^"]+)")?[^>]*>\s*([\s\S]*?)\s*<\/boltAction>/g;
    let match;

    while ((match = regex.exec(queryResponse)) !== null) {
      const [_, type, filePath, content] = match;
      if (type === "shell") {
        steps.push({
          id: uuid(),
          title: `Run "${content.trim()}"`,
          status: "completed",
          description: "Running the command...",
        })
      } else if (type === "file" && filePath) {
        steps.push({
          id: uuid(),
          title: `Create "${filePath}"`,
          status: "completed",
          description: "Creating the file...",
        })
      }
    }
    setMockSteps(steps);
  }

  useEffect(() => {

    setSteps();
    const fileStructure = parseFileStructure(queryResponse);
    const res = convertFileStructureToContent(fileStructure);
    console.log(res, 'structure of data sent to web server');
    setContentToTransfer(res);
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
    const prompts: string[] = [...res.data.prompts, ...res.data.uiPrompts, query];
    const promptsToSend: Prompts[] = prompts.map((prompt) => {
      return { message: prompt, role: 'user' }
    })
    setPrompts(promptsToSend);
    const response = await axios.get('http://127.0.0.1:3000/chat', {
      params: { messages: promptsToSend }
    })

    setQueryResponse(response.data);
    // setQueryResponse(output);
  };

  useEffect(() => {
    const main = async () => {
      if ((webcontainerInstance === undefined)) {
        const container = await WebContainer.boot();
        setContainer(container);
      }
    }
    main();
  }, [])

  useEffect(() => {
    const main = async () => {
      if (webcontainerInstance && contentToTransfer) {
        await webcontainerInstance.mount(contentToTransfer);
      }
    }
    main();
  }, [contentToTransfer])

  const handlePreview = async () => {

    try {
      if (webcontainerInstance && !showPreview) {

        // Install dependencies
        const installProcess = await webcontainerInstance.spawn('npm', ['install']);
        await installProcess.exit;

        await webcontainerInstance.spawn('npm', ['install', 'autoprefixer'])

        // Start development server
        const devProcess = await webcontainerInstance.spawn('npm', ['run', 'dev']);
        devProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log(`[Dev Output]: ${data.toString()}`);
          },
          abort(err) {
            console.error(`[Dev Error]: ${new TextDecoder().decode(err)}`);
          }
        }));

        // Handle server ready event
        webcontainerInstance.on('server-ready', (port, url) => {
          console.log(`Server is ready on ${url}`);
          setSource(url);
        });
      }

    } catch (error) {
      console.log(error, 'error');
    } finally {
      setShowPreview(!showPreview)
    }


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
    <div className='relative'>
      <button
        onClick={handlePreview}
        className="flex items-center px-3 py-1 bg-black text-white rounded-xl hover:bg-blue-700 transition-colors absolute right-5 m-1"
      >
        {/* <Eye size={16} className="mr-2" /> */}
        <div className='bg-blue-600 px-3 py-1'>Code</div>
        <div>Preview</div>
      </button>
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

        {!showPreview && <div className="w-screen h-screen">
          <CodeEditor
            content={selectedContent || 'Select a file to view its contents'}
          />

        </div>}
        {showPreview && <div className="w-screen h-screen">
          <iframe
            title='preview'
            width={'100%'}
            height={'100%'}
            style={{ backgroundColor: 'white' }}
            src={source} />
        </div>}
      </div>

    </div>
  );
}

export default App;