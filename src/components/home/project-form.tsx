"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import ModelSelector from "@/components/ui/model-selector";
import { DEFAULT_MODEL } from "@/lib/ai-models";
import type { AIModelId } from "@/lib/ai-models";

const formSchema = z.object({
  content: z
    .string()
    .min(1, "Project Discription Required!")
    .max(2500, "Description is too long"),
});

const PROJECT_TEMPLATES = [
  {
    emoji: "🎬",
    title: "Build a Netflix clone",
    prompt:
      "Build a Netflix-style homepage with a hero banner (use a nice, dark-mode compatible gradient here), movie sections, responsive cards, and a modal for viewing details using mock data and local state. Use dark mode.",
  },
  {
    emoji: "📦",
    title: "Build an admin dashboard",
    prompt:
      "Create an admin dashboard with a sidebar, stat cards, a chart placeholder, and a basic table with filter and pagination using local state. Use clear visual grouping and balance in your design for a modern, professional look.",
  },
  {
    emoji: "📋",
    title: "Build a kanban board",
    prompt:
      "Build a kanban board with drag-and-drop using react-beautiful-dnd and support for adding and removing tasks with local state. Use consistent spacing, column widths, and hover effects for a polished UI.",
  },
  {
    emoji: "🗂️",
    title: "Build a file manager",
    prompt:
      "Build a file manager with folder list, file grid, and options to rename or delete items using mock data and local state. Focus on spacing, clear icons, and visual distinction between folders and files.",
  },
  {
    emoji: "📺",
    title: "Build a YouTube clone",
    prompt:
      "Build a YouTube-style homepage with mock video thumbnails, a category sidebar, and a modal preview with title and description using local state. Ensure clean alignment and a well-organized grid layout.",
  },
  {
    emoji: "🛍️",
    title: "Build a store page",
    prompt:
      "Build a store page with category filters, a product grid, and local cart logic to add and remove items. Focus on clear typography, spacing, and button states for a great e-commerce UI.",
  },
  {
    emoji: "🏡",
    title: "Build an Airbnb clone",
    prompt:
      "Build an Airbnb-style listings grid with mock data, filter sidebar, and a modal with property details using local state. Use card spacing, soft shadows, and clean layout for a welcoming design.",
  },
  {
    emoji: "🎵",
    title: "Build a Spotify clone",
    prompt:
      "Build a Spotify-style music player with a sidebar for playlists, a main area for song details, and playback controls. Use local state for managing playback and song selection. Prioritize layout balance and intuitive control placement for a smooth user experience. Use dark mode.",
  },
];

interface ProjectFormProps {
  onSubmitMessage?: (message: string, model: AIModelId) => void;
}

const ProjectForm = ({ onSubmitMessage }: ProjectFormProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelId>(
    DEFAULT_MODEL as AIModelId,
  );

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const handleTemplateClick = (prompt: string) => {
    form.setValue("content", prompt);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const content = form.watch("content");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsPending(true);
      form.reset();
      await onSubmitMessage?.(values.content, selectedModel);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PROJECT_TEMPLATES.map((template, index) => (
          <button
            key={index}
            onClick={() => handleTemplateClick(template.prompt)}
            // disabled={isPending}
            className="group relative p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:border-primary/30"
          >
            <div className="flex flex-col gap-2">
              <span className="text-3xl" role="img" aria-label={template.title}>
                {template.emoji}
              </span>
              <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                {template.title}
              </h3>
            </div>
            <div className="absolute inset-0 rounded-xl bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or describe your own idea
          </span>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-lg ring-2 ring-primary/20",
        )}
      >
        <div className="space-y-2">
          <TextAreaAutosize
            id="content"
            {...form.register("content", { onBlur: handleBlur })}
            placeholder="e.g., Build a Netflix-style homepage with a hero banner, movie sections, and responsive cards..."
            minRows={4}
            className={cn(
              "pt-4 resize-none border-none w-full outline-none bg-transparent",
            )}
            onFocus={handleFocus}
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                form.handleSubmit(onSubmit)(e);
              }
            }}
          />

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ModelSelector
                value={selectedModel}
                onChange={setSelectedModel}
                disabled={isPending}
              />
              <span className="text-xs text-muted-foreground">
                {content.length}/2500 characters
              </span>
            </div>

            <Button
              className={cn(
                "size-8 rounded-full",
                isPending && "bg-muted-foreground border",
              )}
              disabled={isPending}
              type="submit"
            >
              {isPending ? <Spinner /> : <ArrowUpIcon className="size-4" />}
            </Button>
          </div>
          {form.formState.errors.content && (
            <p className="text-sm text-destructive">
              {form.formState.errors.content.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
