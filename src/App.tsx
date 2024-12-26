import React, { useState } from 'react';
import { FileExplorer } from './components/FileExplorer';
import { StepsList } from './components/StepsList';
import { CodeEditor } from './components/CodeEditor';
import { FileStructure, Step } from './types';
import { Send } from 'lucide-react';

function App() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState('');

  const mockSteps: Step[] = [
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
  ];

  const mockFileStructure: FileStructure[] = [
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
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBuilding(true);
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