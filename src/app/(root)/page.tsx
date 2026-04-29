"use client";

import Image from "next/image";
import ProjectForm from "@/components/home/project-form";
import { toast } from "sonner";
import { createProject } from "@/modules/updates";
import ProjectHistory from "@/components/home/project-history";
import type { AIModelId } from "@/lib/ai-models";

export default function Page() {
  const handleSubmit = async (message: string, model: AIModelId) => {
    try {
      const newProject = await createProject(message);

      if (!newProject.success) {
        toast.error(newProject.message);
        return;
      }
      toast.success(newProject.message);

      window.location.href = `/project/${newProject.project}?model=${encodeURIComponent(model)}`;
    } catch {
      toast.error("Failed to start dev server");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full p-4">
      <ProjectHistory />
      <div className="w-full max-w-5xl">
        <section className="flex flex-col items-center">
          <div className="flex flex-col items-center">
            <Image
              src="/logo_large.svg"
              alt="Logo"
              width={400}
              height={400}
              className="invert dark:invert-0 md:block hidden"
            />
          </div>
          <h1 className="text-4xl md:text-6xl text-center font-bold">
            Build something with❤️
          </h1>

          {/* <p className="text-center text-muted-foreground text-lg md:text-xl">
            Create and deploy AI agents with ease
          </p> */}

          <div className="max-w-5xl w-full flex flex-col items-center mt-10">
            <ProjectForm onSubmitMessage={handleSubmit} />
          </div>
        </section>
      </div>
    </div>
  );
}
