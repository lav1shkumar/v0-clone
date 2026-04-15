"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { 
  FolderIcon, 
  Clock, 
  ArrowUpRight, 
  FileCode2, 
  Plus, 
  Search,
  Layout,
  Trash2
} from "lucide-react";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
}

const ProjectHistory = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
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
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Prevent card click redirect

    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
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
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
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

  if (isLoading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
        <Spinner className="w-8 h-8 text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading project history...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted bg-accent/5">
        <div className="p-4 rounded-full bg-accent text-muted-foreground">
          <FolderIcon className="w-8 h-8" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Your recent projects will appear here once you start creating!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Layout className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Recent Projects</h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background/50 backdrop-blur-sm text-[11px] font-medium text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>{projects.length} Saved Projects</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => router.push(`/project/${project.id}`)}
            className="group relative cursor-pointer flex flex-col justify-between p-5 rounded-xl border border-border bg-card hover:bg-accent/40 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-lg bg-accent group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDelete(e, project.id)}
                    disabled={deletingIds.has(project.id)}
                  >
                    {deletingIds.has(project.id) ? (
                      <Spinner className="w-3.5 h-3.5" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-bold text-base truncate pr-6 group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimeAgo(project.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                #{project.id.slice(-6).toUpperCase()}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
              >
                Open Project
              </Button>
            </div>
            
            {/* Gloss effect overlay */}
            <div className="absolute inset-0 rounded-xl bg-linear-to-br from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectHistory;
