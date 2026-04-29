"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  Clock,
  FileCode2,
  FolderIcon,
  History,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "../ui/button";

interface Project {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
}

const ProjectHistory = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/project/get");
        const data = await res.json();
        if (data.success) {
          setProjects(data.projects);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setEditingProjectId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const closeDrawer = () => {
    setIsOpen(false);
    setEditingProjectId(null);
  };

  const openProject = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  const handleDelete = async (event: React.MouseEvent, projectId: string) => {
    event.stopPropagation();

    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(projectId));

    try {
      const res = await fetch("/api/project/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (data.success) {
        setProjects((prev) => prev.filter((project) => project.id !== projectId));
        toast.success("Project deleted successfully");
      } else {
        toast.error(data.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  const handleRename = async (projectId: string) => {
    const nextName = editingName.trim();
    if (!nextName) return;

    try {
      const res = await fetch("/api/project/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, name: nextName }),
      });
      const data = await res.json();

      if (data.success) {
        setProjects((prev) =>
          prev.map((project) =>
            project.id === projectId ? { ...project, name: nextName } : project,
          ),
        );
        toast.success("Project renamed successfully");
        setEditingProjectId(null);
        setEditingName("");
      } else {
        toast.error(data.error || "Failed to rename project");
      }
    } catch (error) {
      console.error("Rename error:", error);
      toast.error("An error occurred while renaming");
    }
  };

  const startEditing = (event: React.MouseEvent, project: Project) => {
    event.stopPropagation();
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const cancelEditing = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setEditingProjectId(null);
    setEditingName("");
  };

  const renderDrawerContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16">
          <Spinner className="h-7 w-7 text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading recent projects...
          </p>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
          <div className="rounded-full bg-accent p-4 text-muted-foreground">
            <FolderIcon className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">No projects yet</h3>
            <p className="text-sm text-muted-foreground">
              Your recent projects will appear here once you start creating.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-1.5">
          {projects.map((project) => (
            <div
              key={project.id}
              role="button"
              tabIndex={0}
              onClick={() => openProject(project.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openProject(project.id);
                }
              }}
              className="group cursor-pointer rounded-xl border border-transparent bg-background/55 p-3 transition-all hover:border-primary/20 hover:bg-accent/45 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg border border-border/60 bg-accent/70 p-2 text-muted-foreground transition-colors group-hover:border-primary/20 group-hover:text-primary">
                  <FileCode2 className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  {editingProjectId === project.id ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            event.stopPropagation();
                            handleRename(project.id);
                          }
                          if (event.key === "Escape") {
                            event.preventDefault();
                            event.stopPropagation();
                            cancelEditing();
                          }
                        }}
                        className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRename(project.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Save project name</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cancel rename</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <h3 className="truncate text-sm font-semibold leading-5 transition-colors group-hover:text-primary">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTimeAgo(project.updatedAt)}</span>
                        </div>
                      </div>

                      <div
                        className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          onClick={(event) => startEditing(event, project)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Rename project</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={(event) => handleDelete(event, project.id)}
                          disabled={deletingIds.has(project.id)}
                        >
                          {deletingIds.has(project.id) ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          <span className="sr-only">Delete project</span>
                        </Button>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed left-4 top-24 z-40 hidden sm:block">
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 rounded-full border-border/70 bg-card/80 px-3 text-foreground shadow-sm backdrop-blur-xl hover:bg-accent/70"
          onClick={() => setIsOpen(true)}
          aria-label="Open recent projects"
        >
          <History className="h-4 w-4" />
          <span className="text-sm font-medium">Recent projects</span>
          {!isLoading && projects.length > 0 && (
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-none text-primary-foreground">
              {projects.length}
            </span>
          )}
        </Button>
      </div>

      <div className="fixed bottom-4 left-4 z-40 sm:hidden">
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 rounded-full border-border/70 bg-card/85 px-3 text-foreground shadow-sm backdrop-blur-xl hover:bg-accent/70"
          onClick={() => setIsOpen(true)}
          aria-label="Open recent projects"
        >
          <History className="h-4 w-4" />
          <span className="text-sm font-medium">Recent</span>
          {!isLoading && projects.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-none text-primary-foreground">
              {projects.length}
            </span>
          )}
        </Button>
      </div>

      <div
        className={`fixed inset-0 z-[60] transition ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 cursor-default bg-background/55 backdrop-blur-sm transition-opacity duration-200 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close recent projects"
          onClick={closeDrawer}
          tabIndex={isOpen ? 0 : -1}
        />

        <aside
          aria-label="Recent projects"
          className={`absolute inset-y-0 left-0 flex w-[min(100vw,380px)] flex-col border-r border-border/70 bg-sidebar/95 text-sidebar-foreground shadow-xl backdrop-blur-xl transition-transform duration-200 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold">Recent projects</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {isLoading
                  ? "Loading saved work"
                  : `${projects.length} saved ${
                      projects.length === 1 ? "project" : "projects"
                    }`}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={closeDrawer}
              tabIndex={isOpen ? 0 : -1}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close recent projects</span>
            </Button>
          </div>

          {renderDrawerContent()}
        </aside>
      </div>
    </>
  );
};

export default ProjectHistory;
