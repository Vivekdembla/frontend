import React from "react";
import { Folder, File, ChevronRight, ChevronDown } from "lucide-react";
import { FileStructure } from "../types";
import { Skeleton } from "@mui/material";

interface FileExplorerProps {
  structure: FileStructure[];
  onFileSelect: (content: string) => void;
  content: string;
  showPreview: boolean;
  source: string;
  loadingForUpdate: boolean;
}

const FileExplorerItem = ({
  item,
  onFileSelect,
  depth = 0,
}: {
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
          if (item.type === "folder") {
            setIsOpen(!isOpen);
          } else if (item.content) {
            onFileSelect(item.content);
          }
        }}
      >
        {item.type === "folder" ? (
          <>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Folder size={16} className="ml-1 mr-2" />
          </>
        ) : (
          <File size={16} className="ml-4 mr-2" />
        )}
        <span className="text-sm">{item.name}</span>
      </div>

      {item.type === "folder" && isOpen && item.children && (
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

export const FileExplorer: React.FC<FileExplorerProps> = ({
  structure,
  onFileSelect,
  content,
  showPreview,
  source,
  loadingForUpdate,
}) => {
  return (
    <div className="flex h-full">
      {!showPreview && (
        <div className="h-full w-1/3 bg-gray-900 border-r border-gray-700 overflow-x-scroll">
          <div className="p-2 border-b border-gray-700 h-[6vh] flex items-center">
            <h2 className="text-gray-300 font-semibold">File Explorer</h2>
          </div>
          <div className="overflow-auto h-[94vh]">
            {structure.length === 0 || loadingForUpdate
              ? [...Array(25)].map((_, index) => (
                  <div key={index} className="flex items-center py-1 px-2">
                    <Skeleton
                      animation="wave"
                      height={20}
                      width="60%"
                      style={{ marginBottom: 6 }}
                    />
                  </div>
                ))
              : structure.map((item, index) => (
                  <FileExplorerItem
                    key={index}
                    item={item}
                    onFileSelect={onFileSelect}
                  />
                ))}
          </div>
        </div>
      )}
      <div className="h-full bg-gray-900 w-full">
        <div className="p-2 border-b h-[6vh] border-gray-700 flex justify-between items-center">
          <h2 className="text-gray-300 font-semibold">
            {showPreview ? "Preview" : "Code Editor"}
          </h2>
        </div>
        <div className="p-4 overflow-x-scroll h-[94vh]">
          {!showPreview &&
            (structure.length === 0 || loadingForUpdate ? (
              [...Array(25)].map((_, index) => (
                <div key={index} className="flex items-center py-1 px-2">
                  <Skeleton
                    animation="wave"
                    height={15}
                    width="90%"
                    style={{ marginBottom: 10 }}
                  />
                </div>
              ))
            ) : (
              <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                {content}
              </pre>
            ))}

          {showPreview &&
            (source === "" || loadingForUpdate ? (
              <div className=" w-full h-full">
                <Skeleton
                  animation="wave"
                  style={{
                    height: "100%",
                    transform: "scale(1,1)",
                  }}
                />
              </div>
            ) : (
              <iframe
                title="preview"
                width={"100%"}
                height={"95%"}
                style={{ backgroundColor: "white" }}
                src={source}
              />
            ))}
        </div>
      </div>
    </div>
  );
};
