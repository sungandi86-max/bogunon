"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

const tabs = [
  { key: "overview", label: "개요", mobileLabel: "개요" },
  { key: "schedule", label: "일정", mobileLabel: "일정" },
  { key: "checklist", label: "체크리스트", mobileLabel: "체크" },
  { key: "reservations", label: "예약", mobileLabel: "예약" },
  { key: "budget", label: "예산", mobileLabel: "예산" },
  { key: "notes", label: "노트", mobileLabel: "노트" },
  { key: "files", label: "파일", mobileLabel: "파일" },
] as const;

type WorkspaceTab = (typeof tabs)[number]["key"];

type ProjectWorkspaceShellProps = Readonly<Record<WorkspaceTab, ReactNode>>;

function tabFromHash(): WorkspaceTab {
  const hash = window.location.hash.slice(1);
  return tabs.some((tab) => tab.key === hash) ? hash as WorkspaceTab : "overview";
}

export function ProjectWorkspaceShell(props: ProjectWorkspaceShellProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [activatedLazyTabs, setActivatedLazyTabs] = useState<readonly WorkspaceTab[]>([]);

  useEffect(() => {
    const restoreTab = () => {
      const restored = tabFromHash();
      setActiveTab(restored);
      if (restored === "notes" || restored === "files") {
        setActivatedLazyTabs((current) => current.includes(restored) ? current : [...current, restored]);
      }
    };
    restoreTab();
    window.addEventListener("hashchange", restoreTab);
    return () => window.removeEventListener("hashchange", restoreTab);
  }, []);

  function selectTab(tab: WorkspaceTab): void {
    const url = new URL(window.location.href);
    url.hash = tab;
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    setActiveTab(tab);
    if (tab === "notes" || tab === "files") {
      setActivatedLazyTabs((current) => current.includes(tab) ? current : [...current, tab]);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    const nextTab = tabs.at(nextIndex);
    if (!nextTab) return;
    selectTab(nextTab.key);
    document.getElementById(`project-workspace-tab-${nextTab.key}`)?.focus();
  }

  return (
    <div className="project-workspace">
      <div aria-label="프로젝트 보기" className="project-workspace__tabs" role="tablist">
        {tabs.map((tab, index) => (
          <button
            aria-controls={`project-workspace-panel-${tab.key}`}
            aria-label={tab.label}
            aria-selected={activeTab === tab.key}
            id={`project-workspace-tab-${tab.key}`}
            key={tab.key}
            onClick={() => selectTab(tab.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            role="tab"
            tabIndex={activeTab === tab.key ? 0 : -1}
            type="button"
          >
            <span aria-hidden="true" className="project-workspace__tab-label">{tab.label}</span>
            <span aria-hidden="true" className="project-workspace__tab-label--mobile">{tab.mobileLabel}</span>
          </button>
        ))}
      </div>
      <div className="project-workspace__panels">
        {tabs.map((tab) => (
          <section
            aria-labelledby={`project-workspace-tab-${tab.key}`}
            className="project-workspace__panel"
            hidden={activeTab !== tab.key}
            id={`project-workspace-panel-${tab.key}`}
            key={tab.key}
            role="tabpanel"
          >
            {tab.key !== "notes" && tab.key !== "files"
              ? props[tab.key]
              : activatedLazyTabs.includes(tab.key) ? props[tab.key] : null}
          </section>
        ))}
      </div>
    </div>
  );
}
