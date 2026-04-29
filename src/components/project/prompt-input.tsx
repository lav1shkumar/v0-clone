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
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn(
        "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
        isFocused && "shadow-lg ring-2 ring-primary/20",
        "w-[90%]",
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
              {content.length}/1500 characters
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
  );
};

export default PromptInput;
