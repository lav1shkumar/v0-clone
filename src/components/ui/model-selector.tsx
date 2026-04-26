"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Zap, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_MODELS, type AIModelId } from "@/lib/ai-models";

const ICON_MAP: Record<string, React.ElementType> = {
  "Pro+": Sparkles,
  Pro: Sparkles,
  Lite: Zap,
  Flash: Cpu,
};

const BADGE_COLORS: Record<string, string> = {
  "Pro+": "bg-red-500/15 text-red-400 border-red-500/30",
  Pro: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Lite: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Flash: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

interface ModelSelectorProps {
  value: AIModelId;
  onChange: (model: AIModelId) => void;
  disabled?: boolean;
}

const ModelSelector = ({ value, onChange, disabled }: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = AI_MODELS.find((m) => m.id === value) ?? AI_MODELS[0];
  const SelectedIcon = ICON_MAP[selectedModel.badge] ?? Sparkles;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
          "border bg-background/50 hover:bg-accent/50 transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "ring-2 ring-primary/20 border-primary/30",
        )}
      >
        <SelectedIcon className="w-3.5 h-3.5 text-primary" />
        <span className="text-foreground">{selectedModel.name}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full mb-2 left-0 z-50 min-w-[220px]",
            "rounded-xl border bg-popover/95 backdrop-blur-xl shadow-xl",
            "animate-in fade-in slide-in-from-bottom-2 duration-200",
          )}
        >
          <div className="p-1">
            <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              Select Model
            </p>
            {AI_MODELS.map((model) => {
              const Icon = ICON_MAP[model.badge] ?? Sparkles;
              const isSelected = model.id === value;

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onChange(model.id as AIModelId);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mt-0.5",
                    "transition-all duration-150",
                    isSelected
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent/60 border border-transparent",
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0 w-6 h-6 rounded-md flex items-center justify-center",
                      isSelected
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isSelected
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {model.name}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-semibold px-1 py-0.5 rounded border leading-none",
                          BADGE_COLORS[model.badge],
                        )}
                      >
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">
                      <span className="text-primary/70 font-medium">
                        {model.tokenCost} tokens/req
                      </span>
                    </p>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
