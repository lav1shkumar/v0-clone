"use client";

import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/project/code-view";
import {
  FileSystemTree,
  WebContainer,
  WebContainerProcess,
} from "@webcontainer/api";
import { applyPatchesToTree } from "@/modules/helpers/normalize-tree";
import { downloadZip } from "@/modules/helpers/build-zip";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import PromptInput from "@/components/project/prompt-input";
import {
  Code2,
  Download,
  ExternalLink,
  FileEdit,
  Globe2,
  Loader2,
  MessageSquareText,
  Monitor,
  RotateCw,
  Sparkles,
  Terminal as TerminalIcon,
  Trash2,
} from "lucide-react";
import ChatWindow from "@/components/project/chat";
import { toast } from "sonner";
import { getWebContainer } from "@/modules/helpers/web-container";
import { useCompletion } from "@ai-sdk/react";
import type { AIModelId } from "@/lib/ai-models";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktop(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isDesktop;
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
  const isDesktop = useIsDesktop();

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
          ? summary
              .map((item, index) => `${index + 1}. ${String(item)}`)
              .join("\n")
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
          } catch {
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

  const leftPanel = (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card/85 shadow-sm backdrop-blur-xl">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-2">
        <div className="flex items-center justify-between border-b border-border/70 bg-muted/35 p-2">
          <div className="flex rounded-lg border border-border/70 bg-background/70 p-1 shadow-sm">
            <Button
              variant={activeTab1 === "chat" ? "primary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => setActiveTab1("chat")}
            >
              <MessageSquareText className="h-3.5 w-3.5" />
              Chat
            </Button>
            <Button
              variant={activeTab1 === "terminal" ? "primary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => setActiveTab1("terminal")}
            >
              <TerminalIcon className="h-3.5 w-3.5" />
              Terminal
            </Button>
          </div>
          <span className="hidden truncate px-2 text-xs text-muted-foreground sm:block">
            {projectName}
          </span>
        </div>
        <div className="relative min-h-0 w-full flex-1">
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

      <div className="shrink-0 border-t border-border/70 bg-background/45 p-3">
        <PromptInput
          onSubmitMessage={handleClick}
          initialModel={initialModel}
        />
      </div>
    </div>
  );

  const workspacePanel =
    !isProcessing && !isLoading ? (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card/85 shadow-sm backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-muted/35 p-2">
          <div className="flex rounded-lg border border-border/70 bg-background/70 p-1 shadow-sm">
            <Button
              variant={activeTab2 === "preview" ? "primary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => setActiveTab2("preview")}
            >
              <Monitor className="h-3.5 w-3.5" />
              Preview
            </Button>
            <Button
              variant={activeTab2 === "code" ? "primary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => setActiveTab2("code")}
            >
              <Code2 className="h-3.5 w-3.5" />
              Code
            </Button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                if (devServerUrl && iframeRef.current?.src) {
                  iframeRef.current.src = devServerUrl;
                  setCurrentUrl(devServerUrl);
                }
              }}
              title="Refresh"
            >
              <RotateCw className="h-4 w-4" />
              <span className="sr-only">Refresh preview</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                if (devServerUrl) window.open(devServerUrl, "_blank");
              }}
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Open preview in new tab</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-border/70 bg-background/70"
              onClick={() => {
                downloadZip(files);
              }}
              title="Download project"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
        <div className="relative min-h-0 flex-1">
          <div
            className="absolute inset-0 flex flex-col"
            style={{ display: activeTab2 === "preview" ? "flex" : "none" }}
          >
            {devServerUrl && (
              <div className="flex shrink-0 items-center gap-2 border-b border-border/70 bg-background/45 px-3 py-2">
                <div className="flex h-8 flex-1 items-center gap-2 rounded-lg border border-input bg-background/80 px-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                  <Globe2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    className="w-full border-none bg-transparent font-mono text-xs text-muted-foreground outline-none focus:text-foreground"
                    value={currentUrl}
                    onChange={(e) => setCurrentUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && iframeRef.current) {
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
                className="w-full flex-1 border-none bg-white"
              />
            )}
            {!devServerUrl && (
              <div className="flex h-full flex-col items-center justify-center gap-4 bg-background/30">
                <div className="relative">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <p className="animate-pulse text-sm font-medium text-foreground">
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
    ) : (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card/85 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-border/70 bg-muted/35 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {currentStatus || "Generating..."}
            </p>
            <p className="text-xs text-muted-foreground">
              Applying changes to your project workspace
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-xl">
            {fileOperations.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                    <Sparkles className="h-5 w-5 animate-pulse text-primary" />
                  </div>
                </div>
                <div className="space-y-1 text-center">
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
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-500"
                      style={{
                        animation: `fadeSlideIn 0.4s ease-out ${idx * 0.05}s both`,
                        backgroundColor: isLast
                          ? "var(--accent)"
                          : "transparent",
                      }}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                          isLast
                            ? isWrite
                              ? "bg-primary/15 text-primary"
                              : "bg-destructive/15 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isWrite ? (
                          <FileEdit className="h-3.5 w-3.5" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate font-mono text-xs ${
                            isLast
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {op.path}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isLast && isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : (
                          <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary/20">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2 px-3 pt-3">
                    <div className="flex gap-1">
                      <span className="h-1 w-1 animate-bounce rounded-full bg-primary/40 [animation-delay:-0.3s]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-primary/40 [animation-delay:-0.15s]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-primary/40" />
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
    );

  return (
    <div className="flex h-[calc(100dvh-5rem)] min-h-0 flex-col px-3 pb-4 sm:px-5 lg:px-6">
      {isDesktop ? (
        <ResizablePanelGroup
          autoSaveId="promptly-project-main-layout"
          className="h-full w-full"
          orientation="horizontal"
        >
          <ResizablePanel
            id="project-sidebar"
            defaultSize="32%"
            minSize="320px"
            maxSize="660px"
            groupResizeBehavior="preserve-pixel-size"
          >
            {leftPanel}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="project-workspace" minSize="420px">
            {workspacePanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="grid h-full w-full grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          {leftPanel}
          {workspacePanel}
        </div>
      )}
    </div>
  );
};

export default ProjectView;
