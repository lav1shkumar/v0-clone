"use client";

import React, { useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import { FileExplorer } from "./file-explorer";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

interface CodeViewProps {
  files: any;
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

  const handleEditorWillMount = (monaco: any) => {
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
    <div className="flex h-full w-full border border-border bg-background text-foreground overflow-hidden rounded-md shadow-sm">
      {/* Sidebar - File Explorer */}
      <div className="w-64 border-r border-border flex flex-col h-full bg-sidebar shrink-0">
        <div className="p-3 text-xs font-semibold tracking-wider text-sidebar-foreground/70 uppercase border-b border-border bg-sidebar/50 backdrop-blur-sm">
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
      <div className="flex-1 flex flex-col h-full bg-background min-w-0">
        {selectedFile ? (
          <>
            {/* Editor Tabs */}
            <div className="flex border-b border-border bg-muted/30">
              <div className="px-4 py-2 bg-background border-t-2 border-t-primary text-sm flex items-center gap-2 shadow-[0_1px_0_0_hsl(var(--background))] z-10">
                <span className="truncate max-w-[300px] font-mono text-foreground">
                  {selectedFile.path.split("/").pop()}
                </span>
              </div>
            </div>
            {/* Editor Container */}
            <div className="flex-1 relative">
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
                    <Loader2 className="w-6 h-6 animate-spin" />
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
          <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono text-sm bg-muted/10">
            Select a file to view its contents
          </div>
        )}
      </div>
    </div>
  );
}
