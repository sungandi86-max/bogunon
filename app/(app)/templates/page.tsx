import { MobileCreateButton } from "@/components/layout/mobile-create-button";
import { PageHeader } from "@/components/layout/page-header";
import { TemplateGallery } from "@/components/templates/template-gallery";
import { listWorkflowData } from "@/lib/work-items/phase5-repository";
import { BUILT_IN_TEMPLATES } from "@/lib/work-items/workflow";
import type { TemplateDefinition } from "@/lib/work-items/workflow";

export default async function TemplatesPage() {
  const data = await listWorkflowData();
  const custom: TemplateDefinition[] = data.templates.map((template) => ({
    key: `custom-${template.id}`, customId: template.id, name: template.name, kind: template.item_kind,
    category: template.category, title: template.title, description: template.description ?? "",
    priority: template.priority, estimatedMinutes: template.estimated_minutes ?? 30,
    recommendedTiming: template.recommended_timing ?? "사용자 지정", recurrenceFrequency: template.recurrence_frequency,
    checklist: data.templateChecklistItems.filter((item) => item.template_id === template.id).map((item) => item.title),
    memo: template.memo ?? "",
  }));
  return <main className="page-canvas"><PageHeader action={<MobileCreateButton />} description="자주 쓰는 보건업무를 복제하고 새 업무와 일정에 적용합니다." title="업무 템플릿" /><TemplateGallery builtIn={BUILT_IN_TEMPLATES} custom={custom} /></main>;
}
