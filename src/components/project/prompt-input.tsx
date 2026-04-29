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
    .max(1500, "Description is too long"),
});

interface ProjectFormProps {
  onSubmitMessage?: (message: string, model: AIModelId) => Promise<unknown>;
  initialModel?: AIModelId;
}

const PromptInput = ({
  onSubmitMessage,
  initialModel = DEFAULT_MODEL as AIModelId,
}: ProjectFormProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelId>(initialModel);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const content = form.watch("content");

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

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
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-border/70 bg-card/85 p-3 pt-1 shadow-sm backdrop-blur transition-all",
        isFocused && "border-primary/35 ring-4 ring-primary/10",
      )}
    >
      <div className="space-y-2">
        <TextAreaAutosize
          id="content"
          {...form.register("content", { onBlur: handleBlur })}
          placeholder="e.g., Build a Netflix-style homepage with a hero banner, movie sections, and responsive cards..."
          minRows={3}
          maxRows={8}
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

        <div className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={isPending}
            />
            <span className="text-xs text-muted-foreground">
              {content.length}/1500 characters
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
  );
};

export default PromptInput;
