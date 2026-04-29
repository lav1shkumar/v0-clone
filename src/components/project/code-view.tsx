"use client";

import React, { useState } from "react";
import { Editor, type BeforeMount } from "@monaco-editor/react";
import { FileExplorer } from "./file-explorer";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import type { FileSystemTree } from "@webcontainer/api";

interface CodeViewProps {
  files: FileSystemTree;
  onFileChange?: (path: string, content: string) => void;
}

export function CodeView({ files, onFileChange }: CodeViewProps) {
  const { resolvedTheme } = useTheme();
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    content: string;
  } | null>(null);

  const handleSelectFile = (path: string, content: string) => {
    setSelectedFile({ path, content });
  };

  const getLanguageFromPath = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "tsx":
      case "ts":
        return "typescript";
      case "js":
      case "jsx":
        return "javascript";
      case "json":
        return "json";
      case "css":
        return "css";
      case "html":
        return "html";
      case "md":
        return "markdown";
      default:
        return "plaintext";
    }
  };

  const handleEditorWillMount: BeforeMount = (monaco) => {
    // Configure Monaco to understand JSX/TSX
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: "React.createElement",
      reactNamespace: "React",
      allowNonTsExtensions: true,
      allowJs: true,
      target: monaco.languages.typescript.ScriptTarget.Latest,
    });

    // Disable semantic validation (stops red lines for missing imports/types)
    // but keeps syntax validation for obvious errors.
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar - File Explorer */}
      <div className="flex h-full w-64 shrink-0 flex-col border-r border-border/70 bg-sidebar/80">
        <div className="border-b border-border/70 bg-sidebar/70 p-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70 backdrop-blur-sm">
          Explorer
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <FileExplorer
            files={files}
            onSelectFile={handleSelectFile}
            selectedPath={selectedFile?.path}
          />
        </div>
      </div>

      {/* Main Area - Monaco Editor */}
      <div className="flex h-full min-w-0 flex-1 flex-col bg-background">
        {selectedFile ? (
          <>
            {/* Editor Tabs */}
            <div className="flex border-b border-border/70 bg-muted/30 px-2 pt-2">
              <div className="z-10 flex max-w-full items-center gap-2 rounded-t-lg border border-b-0 border-border/70 bg-background px-3 py-2 text-sm shadow-sm">
                <span className="truncate max-w-[300px] font-mono text-foreground">
                  {selectedFile.path.split("/").pop()}
                </span>
              </div>
            </div>
            {/* Editor Container */}
            <div className="relative flex-1">
              <Editor
                height="100%"
                path={selectedFile.path}
                language={getLanguageFromPath(selectedFile.path)}
                value={selectedFile.content}
                theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                beforeMount={handleEditorWillMount}
                onChange={(value) => {
                  if (value !== undefined) {
                    setSelectedFile((prev) =>
                      prev ? { ...prev, content: value } : null,
                    );
                    onFileChange?.(selectedFile.path, value);
                  }
                }}
                loading={
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                }
                options={{
                  readOnly: false,
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  padding: { top: 16 },
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-muted/10 font-mono text-sm text-muted-foreground">
            Select a file to view its contents
          </div>
        )}
      </div>
    </div>
  );
}
