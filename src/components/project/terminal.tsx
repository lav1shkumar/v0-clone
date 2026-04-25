"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import type { WebContainerProcess } from "@webcontainer/api";

export default function XTerminal({
  process,
}: {
  process: WebContainerProcess | null;
}) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!terminalRef.current || !process) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      cursorWidth: 2,
      cursorInactiveStyle: "none",
      fontSize: 18,
      fontFamily: `"JetBrains Mono", monospace`,
      allowTransparency: true,
      theme: {
        background: "rgba(0,0,0,0)",
        foreground: "#e4e4e7",
        cursor: "#e4e4e7",
      },
    });

    termRef.current = term;

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    term.focus();

    try {
      if (!process.output.locked) {
        process.output.pipeTo(
          new WritableStream({
            write(data) {
              term.write(data);
            },
          }),
        );
      }
    } catch (e) {
      console.warn("Could not pipe process output:", e);
    }

    let writer: any = null;
    try {
      if (!process.input.locked) {
        writer = process.input.getWriter();
      }
    } catch (e) {
      console.warn("Could not acquire process input writer:", e);
    }

    term.onData((input) => {
      writer?.write(input);
    });

    const el = terminalRef.current;
    const handleClick = () => term.focus();
    el.addEventListener("click", handleClick);

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });

    resizeObserver.observe(el);

    return () => {
      termRef.current = null;
      writer?.releaseLock();
      el.removeEventListener("click", handleClick);
      resizeObserver.disconnect();
      term.dispose();
    };
  }, [process]);

  useEffect(() => {
    if (!termRef.current) return;

    const isDark = resolvedTheme === "dark";

    termRef.current.options.theme = {
      background: "rgba(0,0,0,0)",
      foreground: isDark ? "#e4e4e7" : "#18181b",
      cursor: isDark ? "#e4e4e7" : "#18181b",
    };
  }, [resolvedTheme]);

  if (!process) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return <div ref={terminalRef} className="w-full h-full p-1 rounded-md" />;
}
