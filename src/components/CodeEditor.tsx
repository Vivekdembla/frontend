import React from 'react';


interface CodeEditorProps {
  content: string;
  showPreview: boolean;
  source: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ content, showPreview, source }) => {
  return (
    <div className="h-full bg-gray-900 w-full">
      <div className="p-2 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-gray-300 font-semibold">{showPreview?'Preview':'Code Editor'}</h2>
      </div>
      <div className="p-4 h-full">
        {!showPreview && <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
          {content}
        </pre>}
        {showPreview &&
          <iframe
            title='preview'
            width={'100%'}
            height={'95%'}
            style={{backgroundColor: 'white', border: '2px solid red' }}
            src={source} />
        }
      </div>
    </div>
  );
};