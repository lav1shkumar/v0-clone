"use client";


import Image from "next/image";
import ProjectForm from "@/components/home/project-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProject } from "@/modules/updates";
import ProjectHistory from "@/components/home/project-history";

export default function Page() {
  const router = useRouter();

  const handleSubmit = async (message: string) => {
    try {
      const newProject = await createProject(message);

      if (!newProject.success) {
        toast.error(newProject.message);
        return;
      }
      toast.success(newProject.message);

      router.push(`/project/${newProject.project}`);
    } catch (error) {
      toast.error("Failed to start dev server");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full p-4">
      <div className="w-full max-w-5xl">
        <section className="space-y-8 flex flex-col items-center">
          <div className="flex flex-col items-center">
            <Image
              src="/logo_large.svg"
              alt="Logo"
              width={400}
              height={400}
              className="dark:invert md:block hidden"
            />
          </div>
          <h1 className="text-4xl md:text-6xl text-center font-bold">
            Build something with❤️
          </h1>

          {/* <p className="text-center text-muted-foreground text-lg md:text-xl">
            Create and deploy AI agents with ease
          </p> */}

          <div className="max-w-5xl w-full flex flex-col items-center gap-12 mt-12">
            <ProjectForm onSubmitMessage={handleSubmit} />
            <ProjectHistory />
          </div>
        </section>
      </div>
    </div>
  );
}
