"use client";

import type { ElementType } from "react";
import { useState } from "react";
import { Check, ChevronDown, Cpu, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AI_MODEL_PROVIDERS,
  getModelWithProvider,
  type AIModelId,
} from "@/lib/ai-models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const ICON_MAP: Record<string, ElementType> = {
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

const MODEL_PROVIDER_ENTRIES = Object.entries(AI_MODEL_PROVIDERS);

interface ModelSelectorProps {
  value: AIModelId;
  onChange: (model: AIModelId) => void;
  disabled?: boolean;
}

const ModelSelector = ({ value, onChange, disabled }: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { model: selectedModel, providerLabel: selectedProviderLabel } =
    getModelWithProvider(value);
  const SelectedIcon = ICON_MAP[selectedModel.badge] ?? Sparkles;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex max-w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm",
            "border border-border/70 bg-background/70 transition-all duration-200 hover:bg-accent/60",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isOpen && "border-primary/30 ring-2 ring-primary/20",
          )}
        >
          <SelectedIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="min-w-0 truncate text-foreground">
            <span className="text-muted-foreground">
              {selectedProviderLabel}
            </span>
            <span className="mx-1 text-muted-foreground/50">/</span>
            {selectedModel.name}
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-auto min-w-40 max-w-[calc(100vw-2rem)] overflow-visible border-border/70 bg-popover/95 p-1.5 shadow-xl backdrop-blur-xl"
      >
        <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider">
          Select Model
        </DropdownMenuLabel>

        <NavigationMenu
          viewport={false}
          orientation="vertical"
          className="w-40 max-w-none flex-none items-stretch justify-start"
        >
          <NavigationMenuList className="w-full flex-col items-stretch justify-start gap-1">
            {MODEL_PROVIDER_ENTRIES.map(([providerKey, provider]) => (
              <NavigationMenuItem key={providerKey} className="w-full">
                <NavigationMenuTrigger className="h-auto w-full justify-between px-2 py-2 text-xs data-open:bg-accent data-popup-open:bg-accent [&_svg]:-rotate-90">
                  <span className="min-w-0 truncate">{provider.label}</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!absolute !left-0 !top-full z-50 !mt-1.5 w-[min(calc(100vw-2rem),18rem)] border border-border/70 bg-popover/95 p-1.5 shadow-xl backdrop-blur-xl sm:!left-full sm:!top-0 sm:!mt-0 sm:ml-2">
                  <div className="grid gap-1">
                    {provider.models.map((model) => {
                      const Icon = ICON_MAP[model.badge] ?? Sparkles;
                      const isSelected = model.id === value;

                      return (
                        <NavigationMenuLink asChild key={model.id}>
                          <button
                            type="button"
                            onClick={() => {
                              onChange(model.id);
                              setIsOpen(false);
                            }}
                            className={cn(
                              "group/model flex w-full items-center gap-2.5 rounded-md border px-2 py-2 text-left transition-all duration-200",
                              isSelected
                                ? "border-primary/25 bg-primary/10 text-foreground"
                                : "border-transparent hover:border-border/70 hover:bg-accent/70 focus:bg-accent/70",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200",
                                isSelected
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground group-hover/model:text-foreground",
                              )}
                            >
                              <Icon className="size-3.5" />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="flex min-w-0 items-center gap-1.5">
                                <span className="truncate text-xs font-medium">
                                  {model.name}
                                </span>
                                <span
                                  className={cn(
                                    "shrink-0 rounded border px-1 py-0.5 text-[9px] font-semibold leading-none",
                                    BADGE_COLORS[model.badge],
                                  )}
                                >
                                  {model.badge}
                                </span>
                              </span>
                              <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted-foreground">
                                {model.description} · {model.tokenCost} tokens
                              </span>
                            </span>

                            <Check
                              className={cn(
                                "size-3.5 shrink-0 text-primary transition-all duration-200",
                                isSelected
                                  ? "scale-100 opacity-100"
                                  : "scale-75 opacity-0",
                              )}
                            />
                          </button>
                        </NavigationMenuLink>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModelSelector;
