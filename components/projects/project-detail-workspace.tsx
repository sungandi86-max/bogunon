"use client";

import { Ellipsis } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import type { ProjectType } from "@/lib/projects/domain";
import {
  WORKSPACE_TABS,
  workspaceNavigationFor,
} from "@/lib/projects/workspace-navigation";
import type { WorkspaceTab } from "@/lib/projects/workspace-navigation";

type ProjectWorkspaceShellProps = Readonly<Record<WorkspaceTab, ReactNode>> & {
  readonly projectType: ProjectType;
};

function tabFromHash(): WorkspaceTab {
  const hash = window.location.hash.slice(1);
  const match = WORKSPACE_TABS.find((tab) => tab.key === hash);
  return match?.key ?? "overview";
}

export function ProjectWorkspaceShell({ projectType, ...panels }: ProjectWorkspaceShellProps) {
  const navigation = workspaceNavigationFor(projectType);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [activatedLazyTabs, setActivatedLazyTabs] = useState<readonly WorkspaceTab[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const restoreTab = () => {
      const restored = tabFromHash();
      setActiveTab(restored);
      if (restored === "notes" || restored === "files" || restored === "map") {
        setActivatedLazyTabs((current) => current.includes(restored) ? current : [...current, restored]);
      }
    };
    restoreTab();
    window.addEventListener("hashchange", restoreTab);
    return () => window.removeEventListener("hashchange", restoreTab);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !moreRef.current?.contains(event.target)) setMoreOpen(false);
    };
    const closeWithEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMoreOpen(false);
      document.getElementById("project-workspace-more")?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [moreOpen]);

  function selectTab(tab: WorkspaceTab): void {
    const url = new URL(window.location.href);
    url.hash = tab;
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    setActiveTab(tab);
    setMoreOpen(false);
    if (tab === "notes" || tab === "files" || tab === "map") {
      setActivatedLazyTabs((current) => current.includes(tab) ? current : [...current, tab]);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % navigation.primary.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + navigation.primary.length) % navigation.primary.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = navigation.primary.length - 1;
    const nextKey = navigation.primary.at(nextIndex);
    if (!nextKey) return;
    selectTab(nextKey);
    document.getElementById(`project-workspace-tab-${nextKey}`)?.focus();
  }

  const overflowActive = navigation.overflow.includes(activeTab);

  return (
    <div className="project-workspace">
      <div className="project-workspace__tabs">
        <div aria-label="프로젝트 보기" className="project-workspace__tablist" role="tablist">
          {navigation.primary.map((key, index) => {
            const tab = WORKSPACE_TABS.find((candidate) => candidate.key === key);
            if (!tab) return null;
            return (
              <button
                aria-controls={`project-workspace-panel-${tab.key}`}
                aria-label={tab.label}
                aria-selected={activeTab === tab.key}
                id={`project-workspace-tab-${tab.key}`}
                key={tab.key}
                onClick={() => selectTab(tab.key)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                role="tab"
                tabIndex={activeTab === tab.key || (overflowActive && index === 0) ? 0 : -1}
                type="button"
              >
                <span aria-hidden="true" className="project-workspace__tab-label">{tab.label}</span>
                <span aria-hidden="true" className="project-workspace__tab-label--mobile">{tab.mobileLabel}</span>
              </button>
            );
          })}
        </div>
        {navigation.overflow.length > 0 && (
          <div className="project-workspace__more" ref={moreRef}>
            <button
              aria-current={overflowActive ? "page" : undefined}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              aria-label={overflowActive ? "더보기, 현재 노트" : "더보기"}
              className={overflowActive ? "is-active" : undefined}
              id="project-workspace-more"
              onClick={() => setMoreOpen((current) => !current)}
              type="button"
            >
              <Ellipsis aria-hidden="true" size={19} />
              <span>더보기</span>
            </button>
            {moreOpen && (
              <div aria-label="추가 프로젝트 보기" className="project-workspace__more-menu" role="menu">
                {navigation.overflow.map((key) => {
                  const tab = WORKSPACE_TABS.find((candidate) => candidate.key === key);
                  if (!tab) return null;
                  return (
                    <button
                      aria-current={activeTab === tab.key ? "page" : undefined}
                      key={tab.key}
                      onClick={() => selectTab(tab.key)}
                      role="menuitem"
                      type="button"
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="project-workspace__panels">
        {WORKSPACE_TABS.map((tab) => (
          <section
            {...(navigation.overflow.includes(tab.key)
              ? { "aria-label": tab.label }
              : { "aria-labelledby": `project-workspace-tab-${tab.key}` })}
            className="project-workspace__panel"
            hidden={activeTab !== tab.key}
            id={`project-workspace-panel-${tab.key}`}
            key={tab.key}
            role="tabpanel"
          >
            {tab.key !== "notes" && tab.key !== "files" && tab.key !== "map"
              ? panels[tab.key]
              : activatedLazyTabs.includes(tab.key) ? panels[tab.key] : null}
          </section>
        ))}
      </div>
    </div>
  );
}
