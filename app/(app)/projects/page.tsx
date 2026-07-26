import { PageHeader } from "@/components/layout/page-header";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { listProjects } from "@/lib/projects/repository";

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <main className="page-canvas projects-page">
      <PageHeader description="여러 일정을 하나의 목적 아래 모아 관리합니다." title="프로젝트" />
      <ProjectWorkspace projects={projects} />
    </main>
  );
}
