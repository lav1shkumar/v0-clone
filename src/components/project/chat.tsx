import { useEffect, useRef } from "react";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: string;
  content: string;
};

const ChatWindow = ({
  projectId,
  messages,
  setMessages,
  onMessagesLoaded,
  isProcessing,
  status,
}: {
  projectId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onMessagesLoaded?: (messages: ChatMessage[]) => void;
  isProcessing?: boolean;
  status?: string;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getMessages = async () => {
    try {
      const response = await fetch("/api/messages/getmessages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      const loadedMessages = data.messages || [];
      setMessages(loadedMessages);

      if (onMessagesLoaded) {
        onMessagesLoaded(loadedMessages);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getMessages();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth scrollbar-thin scrollbar-thumb-muted-foreground/20"
      >
        {messages.length === 0 ? (
          <div className="flex h-full shrink-0 flex-col items-center justify-center space-y-3 text-center text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-muted/50">
              <Bot className="h-5 w-5" />
            </div>
            <p className="max-w-64 text-sm font-medium leading-6">
              Start with a change request, bug fix, or design idea.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
                message.role === "USER" ? "flex-row-reverse" : "flex-row",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  message.role === "USER"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-muted",
                )}
              >
                {message.role === "USER" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                  message.role === "USER"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "rounded-tl-none border border-border/70 bg-muted/70 text-foreground",
                )}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 flex-row">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex max-w-[82%] items-center gap-2 rounded-2xl rounded-tl-none border border-border/70 bg-muted/70 px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm">
              <span className="flex gap-1 mr-2">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/50" />
              </span>
              <span className="text-muted-foreground font-medium animate-pulse">
                {status || "Thinking..."}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
