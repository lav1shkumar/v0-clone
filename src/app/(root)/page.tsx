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
    <div className="flex w-full flex-col items-center px-4 pb-6 pt-4 sm:px-6 sm:pt-5">
      <ProjectHistory />
      <div className="w-full max-w-6xl">
        <section className="flex flex-col items-center">
          <div className="mb-2 flex h-14 items-center justify-center sm:h-16">
            <Image
              src="/logo_large.svg"
              alt="Logo"
              width={172}
              height={172}
              priority
              className="hidden max-h-16 w-auto invert dark:invert-0 sm:block"
            />
          </div>
          <h1 className="text-center text-3xl font-semibold tracking-normal text-foreground md:text-5xl">
            What do you want to build?
          </h1>
          <p className="mt-2 max-w-2xl text-center text-sm leading-6 text-muted-foreground md:text-base">
            Describe an app, pick a model, and Promptly will turn it into a live
            workspace you can preview, edit, and iterate on.
          </p>

          <div className="mt-5 flex w-full max-w-5xl flex-col items-center">
            <ProjectForm onSubmitMessage={handleSubmit} />
          </div>
        </section>
      </div>
    </div>
  );
}
