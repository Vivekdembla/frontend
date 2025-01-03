import React from 'react';


interface CodeEditorProps {
  content: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ content }) => {
  return (
    <div className="h-full bg-gray-900">
      <div className="p-2 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-gray-300 font-semibold">Code Editor</h2>

      </div>
      <div className="p-4">
        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    </div>
  );
};