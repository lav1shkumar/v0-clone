"use client";

import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/project/code-view";
import { FileSystemTree, WebContainer } from "@webcontainer/api";
import { applyPatchesToTree } from "@/modules/helpers/normalize-tree";
import { downloadZip } from "@/modules/helpers/build-zip";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import PromptInput from "@/components/project/prompt-input";
import { ArrowLeft, ArrowRight, Download, RotateCw } from "lucide-react";
import ChatWindow from "@/components/project/chat";
import { toast } from "sonner";
import { getWebContainer } from "@/modules/helpers/web-container";

const XTerminal = dynamic(() => import("@/components/project/terminal"), {
  ssr: false,
});

interface ProjectViewProps {
  projectId: string;
  initialFiles: FileSystemTree;
}

const ProjectView = ({ projectId, initialFiles }: ProjectViewProps) => {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [files, setFiles] = useState<FileSystemTree>(initialFiles);
  const [devServerUrl, setDevServerUrl] = useState<string | null>(null);
  const [process, setProcess] = useState<any>(null);
  const [activeTab1, setActiveTab1] = useState<"terminal" | "chat">("chat");
  const [activeTab2, setActiveTab2] = useState<"preview" | "code">("preview");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const hasAutoTriggered = useRef(false);

  const handleMessagesLoaded = async (loadedMessages: any[]) => {
    if (
      loadedMessages.length > 0 &&
      !hasAutoTriggered.current &&
      !isProcessing
    ) {
      const lastMessage = loadedMessages[loadedMessages.length - 1];
      if (lastMessage.role === "USER") {
        hasAutoTriggered.current = true;
        setIsProcessing(true);
        try {
          await send_request(lastMessage.content);
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  const send_request = async (userPrompt: string) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userPrompt, files: files }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error);
      setIsProcessing(false);
      return;
    }

    try {
      const { files: patches, summary } = data;
      console.log("Received patches:", patches);
      console.log("Received summary:", summary);

      const updatedFiles = applyPatchesToTree(files, patches);

      const res = await fetch("/api/messages/addmessages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          files: updatedFiles,
          message: summary,
          role: "ASSISTANT",
        }),
      });

      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "ASSISTANT", content: summary },
      ]);

      if (!res.ok) {
        toast.error("Failed to add message");
        setIsProcessing(false);
        return;
      }

      const Response = await fetch("/api/project/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          files: updatedFiles,
        }),
      });

      console.log(Response);

      if (!Response.ok) {
        toast.error("Failed to update project");
        setIsProcessing(false);
        return;
      }
      toast.success("Project updated successfully");
      setFiles(updatedFiles);
      window.dispatchEvent(new CustomEvent("userUpdated"));
    } catch (e) {
      console.error("Failed to apply patches:", e);
    }
  };

  const mountFiles = async () => {
    if (webcontainer && files) {
      await webcontainer.mount(files);
      console.log("Mounted files");
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

    webcontainer.on("server-ready", (port, url) => {
      console.log("Server ready");
      setDevServerUrl(url);
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

  const handleClick = async (userPrompt: string) => {
    setIsProcessing(true);
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

        await send_request(userPrompt);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Failed to send request to AI:", error);
    } finally {
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
            <PromptInput onSubmitMessage={handleClick} />
          </div>
        </div>

        {!isProcessing && (
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
                  onClick={() =>
                    iframeRef.current?.contentWindow?.postMessage(
                      { type: "nav", action: "back" },
                      "*",
                    )
                  }
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    iframeRef.current?.contentWindow?.postMessage(
                      { type: "nav", action: "forward" },
                      "*",
                    )
                  }
                  title="Forward"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (iframeRef.current)
                      iframeRef.current.src = iframeRef.current.src;
                  }}
                  title="Refresh"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadZip(files)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 relative">
              <div
                className="absolute inset-0"
                style={{ display: activeTab2 === "preview" ? "block" : "none" }}
              >
                {devServerUrl && (
                  <iframe
                    ref={iframeRef}
                    src={devServerUrl}
                    className="h-full w-full"
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
        {isProcessing && (
          <div className="flex flex-col col-span-2 w-full h-full border border-primary rounded-md overflow-hidden">
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-sm font-medium text-foreground animate-pulse">
                  Processing AI request...
                </p>
                <p className="text-xs text-muted-foreground">
                  Applying changes to filesystem
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectView;
