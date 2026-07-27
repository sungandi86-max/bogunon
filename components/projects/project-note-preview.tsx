type ProjectNotePreviewProps = {
  readonly content: string;
};

function MarkdownLine({ line }: { readonly line: string }) {
  if (line.startsWith("## ")) return <h4>{line.slice(3)}</h4>;
  if (line.startsWith("# ")) return <h3>{line.slice(2)}</h3>;

  const task = /^- \[([ xX])\] (.*)$/.exec(line);
  if (task) {
    const checked = task[1]?.toLocaleLowerCase() === "x";
    const label = task[2] ?? "";
    return (
      <div className="project-note-preview__task">
        <input aria-label={label} checked={checked} disabled readOnly type="checkbox" />
        <span className={checked ? "is-completed" : undefined}>{label}</span>
      </div>
    );
  }

  if (line.startsWith("- ")) {
    return <p className="project-note-preview__list"><span aria-hidden="true">•</span>{line.slice(2)}</p>;
  }

  const ordered = /^(\d+)\. (.*)$/.exec(line);
  if (ordered) {
    return (
      <p className="project-note-preview__list">
        <span>{ordered[1]}.</span>
        {ordered[2]}
      </p>
    );
  }

  if (!line) return <div aria-hidden="true" className="project-note-preview__break" />;
  return <p>{line}</p>;
}

export function ProjectNotePreview({ content }: ProjectNotePreviewProps) {
  if (!content.trim()) {
    return <p className="project-note-preview__empty">작성한 본문이 없습니다.</p>;
  }

  return (
    <div aria-label="노트 미리보기" className="project-note-preview">
      {content.split(/\r?\n/).map((line, index) => (
        <MarkdownLine key={`${index}-${line}`} line={line} />
      ))}
    </div>
  );
}
