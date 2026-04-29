"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon } from "lucide-react";
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
    hint: "Hero, rows, cards, and detail modal",
    prompt:
      "Build a Netflix-style homepage with a hero banner (use a nice, dark-mode compatible gradient here), movie sections, responsive cards, and a modal for viewing details using mock data and local state. Use dark mode.",
  },
  {
    emoji: "📦",
    title: "Build an admin dashboard",
    hint: "Stats, chart placeholder, table, filters",
    prompt:
      "Create an admin dashboard with a sidebar, stat cards, a chart placeholder, and a basic table with filter and pagination using local state. Use clear visual grouping and balance in your design for a modern, professional look.",
  },
  {
    emoji: "📋",
    title: "Build a kanban board",
    hint: "Columns, tasks, local state, drag-and-drop",
    prompt:
      "Build a kanban board with drag-and-drop using react-beautiful-dnd and support for adding and removing tasks with local state. Use consistent spacing, column widths, and hover effects for a polished UI.",
  },
  {
    emoji: "🗂️",
    title: "Build a file manager",
    hint: "Folders, grid, rename, delete actions",
    prompt:
      "Build a file manager with folder list, file grid, and options to rename or delete items using mock data and local state. Focus on spacing, clear icons, and visual distinction between folders and files.",
  },
  {
    emoji: "📺",
    title: "Build a YouTube clone",
    hint: "Video grid, sidebar, categories, preview",
    prompt:
      "Build a YouTube-style homepage with mock video thumbnails, a category sidebar, and a modal preview with title and description using local state. Ensure clean alignment and a well-organized grid layout.",
  },
  {
    emoji: "🛍️",
    title: "Build a store page",
    hint: "Filters, product grid, cart interactions",
    prompt:
      "Build a store page with category filters, a product grid, and local cart logic to add and remove items. Focus on clear typography, spacing, and button states for a great e-commerce UI.",
  },
  {
    emoji: "🏡",
    title: "Build an Airbnb clone",
    hint: "Listings, filters, property details modal",
    prompt:
      "Build an Airbnb-style listings grid with mock data, filter sidebar, and a modal with property details using local state. Use card spacing, soft shadows, and clean layout for a welcoming design.",
  },
  {
    emoji: "🎵",
    title: "Build a Spotify clone",
    hint: "Playlists, player controls, dark UI",
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
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PROJECT_TEMPLATES.map((template, index) => (
          <button
            key={index}
            onClick={() => handleTemplateClick(template.prompt)}
            // disabled={isPending}
            className="group relative min-h-30 overflow-hidden rounded-lg border border-border/70 bg-card/75 p-3 text-left shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-accent/45 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="relative z-10 flex h-full flex-col gap-3 justify-center">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-base"
                role="img"
                aria-label={template.title}
              >
                {template.emoji}
              </span>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold leading-4 transition-colors group-hover:text-primary">
                  {template.title}
                </h3>
                <p className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                  {template.hint}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <div className="relative py-0.5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="rounded-full border border-border/70 bg-background/90 px-3 py-1 text-muted-foreground shadow-sm backdrop-blur">
            Or describe your own idea
          </span>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative overflow-hidden rounded-xl border border-border/70 bg-card/85 p-3 pt-1 shadow-lg shadow-black/5 backdrop-blur-xl transition-all",
          isFocused && "border-primary/35 ring-4 ring-primary/10",
        )}
      >
        <div className="space-y-1.5">
          <TextAreaAutosize
            id="content"
            {...form.register("content", { onBlur: handleBlur })}
            placeholder="e.g., Build a Netflix-style homepage with a hero banner, movie sections, and responsive cards..."
            minRows={3}
            className={cn(
              "w-full resize-none border-none bg-transparent pt-3 text-sm leading-6 outline-none placeholder:text-muted-foreground/70",
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

          <div className="flex flex-col gap-2 border-t border-border/60 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
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
                "size-9 rounded-full shadow-sm",
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
