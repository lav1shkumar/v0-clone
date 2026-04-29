"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  type GroupProps,
  type Layout,
  type LayoutStorage,
  type PanelProps,
  type SeparatorProps,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

const safeLayoutStorage: LayoutStorage = {
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
};

type ResizablePanelGroupProps = GroupProps & {
  autoSaveId?: string;
};

function ResizablePanelGroup({
  autoSaveId,
  className,
  defaultLayout,
  onLayoutChanged,
  ...props
}: ResizablePanelGroupProps) {
  const generatedId = React.useId();
  const persistedLayout = useDefaultLayout({
    id: autoSaveId ?? `resizable-panel-group-${generatedId}`,
    storage: safeLayoutStorage,
  });

  const handleLayoutChanged = React.useCallback(
    (layout: Layout) => {
      if (autoSaveId) {
        persistedLayout.onLayoutChanged(layout);
      }
      onLayoutChanged?.(layout);
    },
    [autoSaveId, onLayoutChanged, persistedLayout],
  );

  return (
    <Group
      className={cn("h-full w-full", className)}
      defaultLayout={
        autoSaveId ? (persistedLayout.defaultLayout ?? defaultLayout) : defaultLayout
      }
      onLayoutChanged={handleLayoutChanged}
      {...props}
    />
  );
}

function ResizablePanel({ className, ...props }: PanelProps) {
  return <Panel className={cn("min-h-0 min-w-0", className)} {...props} />;
}

type ResizableHandleProps = SeparatorProps & {
  withHandle?: boolean;
};

function ResizableHandle({
  className,
  withHandle,
  ...props
}: ResizableHandleProps) {
  return (
    <Separator
      className={cn(
        "relative flex w-3 shrink-0 cursor-col-resize items-center justify-center outline-none transition-colors",
        "after:absolute after:inset-y-3 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-border",
        "hover:after:bg-primary/60 focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-9 w-4 items-center justify-center rounded-full border border-border/70 bg-background/95 text-muted-foreground shadow-sm transition-colors hover:text-foreground">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      )}
    </Separator>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
