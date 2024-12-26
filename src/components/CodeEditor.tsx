import React from 'react';
import { Eye } from 'lucide-react';

interface CodeEditorProps {
  content: string;
  onPreviewClick: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ content, onPreviewClick }) => {
  return (
    <div className="h-full bg-gray-900">
      <div className="p-2 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-gray-300 font-semibold">Code Editor</h2>
        <button
          onClick={onPreviewClick}
          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Eye size={16} className="mr-2" />
          Preview
        </button>
      </div>
      <div className="p-4">
        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    </div>
  );
};