import { getUser } from "@/modules/auth/actions";
import { notFound } from "next/navigation";
import ProjectView from "@/components/project/ProjectView";
import { FileSystemTree } from "@webcontainer/api";
import { getProjectById } from "@/modules/updates";
import {
  DEFAULT_MODEL,
  VALID_MODEL_IDS,
  type AIModelId,
} from "@/lib/ai-models";

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams?: Promise<{
    model?: string | string[];
  }>;
}

const ProjectPage = async ({ params, searchParams }: PageProps) => {
  const { projectId } = await params;
  const query = await searchParams;
  const modelParam = Array.isArray(query?.model)
    ? query.model[0]
    : query?.model;
  const initialModel: AIModelId =
    modelParam && VALID_MODEL_IDS.includes(modelParam)
      ? (modelParam as AIModelId)
      : (DEFAULT_MODEL as AIModelId);

  const userResponse = await getUser();
  if (!userResponse.success || !userResponse.user) {
    notFound();
  }

  const projectResponse = await getProjectById(projectId, userResponse.user.id);
  if (!projectResponse.success || !projectResponse.project) {
    notFound();
  }

  const initialFiles = projectResponse.project
    .files as unknown as FileSystemTree;

  return (
    <ProjectView
      projectId={projectId}
      projectName={projectResponse.project.name}
      initialFiles={initialFiles}
      initialModel={initialModel}
    />
  );
};

export default ProjectPage;
