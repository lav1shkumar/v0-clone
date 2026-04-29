"use client"

import React, { useState } from "react"
import { Folder, FolderOpen, File, ChevronRight, ChevronDown } from "lucide-react"
import type { DirectoryNode, FileNode as WebContainerFileNode, FileSystemTree } from "@webcontainer/api"

interface FileExplorerProps {
  files: FileSystemTree;
  currentPath?: string;
  onSelectFile: (path: string, content: string) => void;
  selectedPath?: string;
}

export function FileExplorer({ files, currentPath = "", onSelectFile, selectedPath }: FileExplorerProps) {
  // Sort files: directories first, then files
  const entries = Object.entries(files || {}).sort(([aName, aVal], [bName, bVal]) => {
    const isADir = 'directory' in aVal;
    const isBDir = 'directory' in bVal;
    if (isADir && !isBDir) return -1;
    if (!isADir && isBDir) return 1;
    return aName.localeCompare(bName);
  });

  return (
    <div className="w-full overflow-y-auto font-mono text-sm">
      {entries.map(([name, node]) => {
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        const isDir = 'directory' in node;

        if (isDir) {
          return (
            <FolderNode
              key={fullPath}
              name={name}
              node={(node as DirectoryNode).directory}
              fullPath={fullPath}
              onSelectFile={onSelectFile}
              selectedPath={selectedPath}
            />
          )
        }

        return (
          <FileNode
            key={fullPath}
            name={name}
            content={(node as WebContainerFileNode).file?.contents || ""}
            fullPath={fullPath}
            onSelectFile={onSelectFile}
            selectedPath={selectedPath}
          />
        )
      })}
    </div>
  )
}

interface FolderNodeProps {
  name: string;
  node: FileSystemTree;
  fullPath: string;
  onSelectFile: (path: string, content: string) => void;
  selectedPath?: string;
}

function FolderNode({ name, node, fullPath, onSelectFile, selectedPath }: FolderNodeProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full">
      <div
        className="flex cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 transition-transform" /> : <ChevronRight className="h-4 w-4 shrink-0 transition-transform" />}
        {isOpen ? <FolderOpen className="h-4 w-4 shrink-0 text-primary" /> : <Folder className="h-4 w-4 shrink-0 text-primary" />}
        <span className="truncate select-none font-medium">{name}</span>
      </div>
      {isOpen && (
        <div className="ml-[13px] border-l border-border/50 pl-3">
          <FileExplorer files={node} currentPath={fullPath} onSelectFile={onSelectFile} selectedPath={selectedPath} />
        </div>
      )}
    </div>
  )
}

interface FileNodeProps {
  name: string;
  content: string | Uint8Array;
  fullPath: string;
  onSelectFile: (path: string, content: string) => void;
  selectedPath?: string;
}

function FileNode({ name, content, fullPath, onSelectFile, selectedPath }: FileNodeProps) {
  const isSelected = selectedPath === fullPath;
  const textContent =
    typeof content === "string" ? content : new TextDecoder().decode(content);
  
  return (
    <div
      className={`flex cursor-pointer items-center gap-1.5 px-2.5 py-1.5 pl-6 transition-colors ${isSelected ? "border-r-2 border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/55 hover:text-foreground"}`}
      onClick={() => onSelectFile(fullPath, textContent)}
    >
      <File className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
      <span className="truncate select-none">{name}</span>
    </div>
  )
}
