import React from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import { FileStructure } from '../types';

interface FileExplorerProps {
  structure: FileStructure[];
  onFileSelect: (content: string) => void;
}

const FileExplorerItem = ({ item, onFileSelect, depth = 0 }: { 
  item: FileStructure; 
  onFileSelect: (content: string) => void;
  depth?: number;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="text-gray-300">
      <div 
        className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer`}
        style={{ paddingLeft: `${depth * 1.5}rem` }}
        onClick={() => {
          if (item.type === 'folder') {
            setIsOpen(!isOpen);
          } else if (item.content) {
            onFileSelect(item.content);
          }
        }}
      >
        {item.type === 'folder' ? (
          <>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Folder size={16} className="ml-1 mr-2" />
          </>
        ) : (
          <File size={16} className="ml-4 mr-2" />
        )}
        <span className="text-sm">{item.name}</span>
      </div>
      
      {item.type === 'folder' && isOpen && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileExplorerItem 
              key={index} 
              item={child} 
              onFileSelect={onFileSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ structure, onFileSelect }) => {
  return (
    <div className="h-full bg-gray-900 border-r border-gray-700">
      <div className="p-2 border-b border-gray-700">
        <h2 className="text-gray-300 font-semibold">File Explorer</h2>
      </div>
      <div className="overflow-y-auto">
        {structure.map((item, index) => (
          <FileExplorerItem key={index} item={item} onFileSelect={onFileSelect} />
        ))}
      </div>
    </div>
  );
};