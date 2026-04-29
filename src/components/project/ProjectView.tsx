"use client";

import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/project/code-view";
import { FileSystemTree, WebContainer, WebContainerProcess } from "@webcontainer/api";
import { applyPatchesToTree } from "@/modules/helpers/normalize-tree";
import { downloadZip } from "@/modules/helpers/build-zip";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import PromptInput from "@/components/project/prompt-input";
import {
  Download,
  ExternalLink,
  FileEdit,
  Loader2,
  RotateCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import ChatWindow from "@/components/project/chat";
import { toast } from "sonner";
import { getWebContainer } from "@/modules/helpers/web-container";
import { useCompletion } from "@ai-sdk/react";
import type { AIModelId } from "@/lib/ai-models";

const XTerminal = dynamic(() => import("@/components/project/terminal"), {
  ssr: false,
});

interface ProjectViewProps {
  projectId: string;
  projectName: string;
  initialFiles: FileSystemTree;
  initialModel: AIModelId;
}

type ChatMessage = {
  role: string;
  content: string;
};

const extractJson = (text: string) => {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return text;
};

const ProjectView = ({
  projectId,
  projectName,
  initialFiles,
  initialModel,
}: ProjectViewProps) => {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [files, setFiles] = useState<FileSystemTree>(initialFiles);
  const [devServerUrl, setDevServerUrl] = useState<string | null>(null);
  const [process, setProcess] = useState<WebContainerProcess | null>(null);
  const [activeTab1, setActiveTab1] = useState<"terminal" | "chat">("chat");
  const [activeTab2, setActiveTab2] = useState<"preview" | "code">("preview");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const hasAutoTriggered = useRef(false);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [fileOperations, setFileOperations] = useState<
    { type: string; path: string }[]
  >([]);

  const selectedModelRef = useRef<AIModelId>(initialModel);

  const { complete, completion, isLoading } = useCompletion({
    api: "/api/chat",
    streamProtocol: "text",

    onFinish: async (prompt, resultText) => {
      setIsProcessing(true);
      setCurrentStatus("Finalizing changes...");
      try {
        const jsonStr = extractJson(resultText);
        const data = JSON.parse(jsonStr);
        const { files: patches, summary } = data;

        // console.log("Received patches:", patches);
        // console.log("Received summary:", summary);

        const updatedFiles = applyPatchesToTree(files, patches);

        const formattedSummary = Array.isArray(summary)
          ? summary.map((item, index) => `${index + 1}. ${String(item)}`).join("\n")
          : String(summary ?? "");

        const res = await fetch("/api/messages/addmessages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            files: updatedFiles,
            message: formattedSummary,
            role: "ASSISTANT",
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to add message");
        }

        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "ASSISTANT", content: formattedSummary },
        ]);

        const projectRes = await fetch("/api/project/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            files: updatedFiles,
          }),
        });

        if (!projectRes.ok) throw new Error("Failed to update project");

        toast.success("Project updated successfully");
        setFiles(updatedFiles);
        window.dispatchEvent(new CustomEvent("userUpdated"));
      } catch (e) {
        console.error("Failed to parse or apply final result:", e);
        toast.error("Failed to apply the AI updates.");
      } finally {
        setIsProcessing(false);
      }
    },

    onError: (error) => {
      toast.error(error.message || "An error occurred");
      console.log(error);
      setIsProcessing(false);
    },
  });

  useEffect(() => {
    if (completion) {
      const allOps = [
        ...completion.matchAll(/"type":\s*"([^"]+)"[^]*?"path":\s*"([^"]+)"/g),
      ];

      if (allOps.length > 0) {
        const ops = allOps.map((match) => ({
          type: match[1],
          path: match[2],
        }));

        setFileOperations(ops);

        const last = ops[ops.length - 1];
        setCurrentStatus(
          last.type === "write"
            ? `Updating ${last.path}`
            : `Deleting ${last.path}`,
        );
      }
    }
  }, [completion]);

  const handleMessagesLoaded = async (loadedMessages: ChatMessage[]) => {
    if (
      loadedMessages.length > 0 &&
      !hasAutoTriggered.current &&
      !isProcessing
    ) {
      const lastMessage = loadedMessages[loadedMessages.length - 1];
      if (lastMessage.role === "USER") {
        hasAutoTriggered.current = true;
        setIsProcessing(true);
        await send_request(lastMessage.content);
      }
    }
  };

  const send_request = async (userPrompt: string, model?: AIModelId) => {
    setCurrentStatus("Thinking...");
    setFileOperations([]);

    const modelToUse = model || selectedModelRef.current;
    selectedModelRef.current = modelToUse;

    complete(userPrompt, {
      body: { files: files, model: modelToUse },
    });
  };

  const mountFiles = async () => {
    if (webcontainer && files) {
      await webcontainer.mount(files);
      // console.log("Mounted files");
    }
  };

  const runDevServer = async () => {
    if (!webcontainer) return;

    const installProcess = await webcontainer.spawn("npm", ["install"]);
    setProcess(installProcess);

    const installExitCode = await installProcess.exit;
    if (installExitCode !== 0) {
      throw new Error("Unable to run npm install");
    }

    const devProcess = await webcontainer.spawn("npm", ["run", "dev"]);
    setProcess(devProcess);

    const bash = await webcontainer.spawn("bash");
    setProcess(bash);

    webcontainer.on("server-ready", (port, url) => {
      // console.log("Server ready");
      setDevServerUrl(url);
      setCurrentUrl(url);
    });
  };

  useEffect(() => {
    const init = async () => {
      const container = await getWebContainer();
      setWebcontainer(container);
    };
    init();
  }, []);

  useEffect(() => {
    if (webcontainer) {
      mountFiles();
      runDevServer();
    }
  }, [webcontainer]);

  useEffect(() => {
    if (webcontainer) {
      mountFiles();
    }
  }, [files]);

  const handleFileChange = async (path: string, content: string) => {
    if (webcontainer) {
      try {
        const parts = path.split("/");
        let currentPath = "";
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath += (currentPath ? "/" : "") + parts[i];
          try {
            await webcontainer.fs.mkdir(currentPath, { recursive: true });
          } catch (e) {
            // ignore
          }
        }
        await webcontainer.fs.writeFile("/" + path, content);
      } catch (error) {
        console.error("Failed to write file to WebContainer:", error);
      }
    }

    setFiles((prevFiles) => {
      const newFiles = JSON.parse(JSON.stringify(prevFiles));
      const parts = path.split("/");
      let current = newFiles;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = { directory: {} };
        }
        current = current[parts[i]].directory;
      }
      const fileName = parts[parts.length - 1];
      if (current[fileName] && current[fileName].file) {
        current[fileName].file.contents = content;
      } else {
        current[fileName] = { file: { contents: content } };
      }
      return newFiles;
    });
  };

  const handleClick = async (userPrompt: string, model: AIModelId) => {
    setIsProcessing(true);
    selectedModelRef.current = model;
    try {
      const res = await fetch("/api/messages/addmessages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: userPrompt, role: "USER" }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "USER", content: userPrompt },
        ]);

        await send_request(userPrompt, model);
      } else {
        toast.error(data.message);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Failed to send request to AI:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid grid-cols-3 gap-2 px-10 justify-center h-[90vh] w-full">
        <div className="flex flex-col w-full h-full border border-primary rounded-md overflow-hidden">
          <div className="flex flex-col gap-2 w-full flex-1 min-h-0">
            <div className="flex items-center gap-2 p-2 border-b border-primary bg-accent">
              <Button
                variant={activeTab1 === "chat" ? "primary" : "outline"}
                size="sm"
                onClick={() => setActiveTab1("chat")}
              >
                Chat
              </Button>
              <Button
                variant={activeTab1 === "terminal" ? "primary" : "outline"}
                size="sm"
                onClick={() => setActiveTab1("terminal")}
              >
                Terminal
              </Button>
            </div>
            <div className="relative w-full h-full">
              <div
                className="absolute inset-0"
                style={{ display: activeTab1 === "chat" ? "block" : "none" }}
              >
                <ChatWindow
                  projectId={projectId}
                  messages={messages}
                  setMessages={setMessages}
                  onMessagesLoaded={handleMessagesLoaded}
                  isProcessing={isLoading || isProcessing}
                  status={currentStatus}
                />
              </div>

              <div
                className="absolute inset-0"
                style={{
                  display: activeTab1 === "terminal" ? "block" : "none",
                }}
              >
                <XTerminal process={process} />
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center p-4">
            <PromptInput
              onSubmitMessage={handleClick}
              initialModel={initialModel}
            />
          </div>
        </div>

        {!isProcessing && !isLoading && (
          <div className="flex flex-col col-span-2 w-full h-full border border-primary rounded-md overflow-hidden">
            <div className="flex items-center gap-2 p-2 border-b border-primary bg-accent">
              <Button
                variant={activeTab2 === "preview" ? "primary" : "outline"}
                size="sm"
                onClick={() => setActiveTab2("preview")}
              >
                Preview
              </Button>
              <Button
                variant={activeTab2 === "code" ? "primary" : "outline"}
                size="sm"
                onClick={() => setActiveTab2("code")}
              >
                Code
              </Button>
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (devServerUrl && iframeRef.current?.src) {
                      iframeRef.current.src = devServerUrl;
                      setCurrentUrl(devServerUrl);
                    }
                  }}
                  title="Refresh"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (devServerUrl) window.open(devServerUrl, "_blank");
                  }}
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadZip(files);
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 relative">
              <div
                className="absolute inset-0 flex flex-col"
                style={{ display: activeTab2 === "preview" ? "flex" : "none" }}
              >
                {devServerUrl && (
                  <div className="flex items-center px-2 py-1.5 border-b border-border bg-muted/30 gap-2 shrink-0">
                    <div className="flex-1 flex items-center bg-background border border-input rounded-md px-2.5 h-8 focus-within:ring-1 focus-within:ring-primary shadow-sm">
                      <input
                        type="text"
                        className="w-full text-xs font-mono bg-transparent border-none outline-none text-muted-foreground focus:text-foreground"
                        value={currentUrl}
                        onChange={(e) => setCurrentUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (iframeRef.current)
                              iframeRef.current.src = currentUrl;
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                {devServerUrl && (
                  <iframe
                    ref={iframeRef}
                    src={devServerUrl}
                    className="flex-1 w-full border-none bg-white"
                  />
                )}
                {!devServerUrl && (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground animate-pulse">
                        Starting dev server...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Installing dependencies & booting up
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div
                className="absolute inset-0"
                style={{ display: activeTab2 === "code" ? "block" : "none" }}
              >
                <CodeView files={files} onFileChange={handleFileChange} />
              </div>
            </div>
          </div>
        )}
        {(isLoading || isProcessing) && (
          <div className="flex flex-col col-span-2 w-full h-full border border-primary rounded-md overflow-hidden bg-background">
            <div className="flex items-center gap-2 p-3 border-b border-border bg-accent">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-foreground">
                {currentStatus || "Generating..."}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-lg mx-auto">
                {fileOperations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                      <div className="relative w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Analyzing your request
                      </p>
                      <p className="text-xs text-muted-foreground">
                        The AI is planning the changes...
                      </p>
                    </div>
                  </div>
                )}

                {fileOperations.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        File Operations
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {fileOperations.map((op, idx) => {
                      const isLast = idx === fileOperations.length - 1;
                      const isWrite = op.type === "write";

                      return (
                        <div
                          key={`${op.path}-${idx}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-500"
                          style={{
                            animation: `fadeSlideIn 0.4s ease-out ${idx * 0.05}s both`,
                            backgroundColor: isLast
                              ? "var(--accent)"
                              : "transparent",
                          }}
                        >
                          <div
                            className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-300 ${
                              isLast
                                ? isWrite
                                  ? "bg-primary/15 text-primary"
                                  : "bg-destructive/15 text-destructive"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isWrite ? (
                              <FileEdit className="w-3.5 h-3.5" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-mono truncate ${
                                isLast
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {op.path}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {isLast && isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {isLoading && (
                      <div className="flex items-center gap-2 px-3 pt-3">
                        <div className="flex gap-1">
                          <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Writing file contents...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectView;
