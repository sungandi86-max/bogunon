export default function SettingsLoading() {
  return <main className="page-canvas settings-page" aria-busy="true" aria-label="설정 불러오는 중"><div className="settings-skeleton settings-skeleton--title" /><div className="settings-skeleton-grid">{Array.from({ length: 4 }, (_, index) => <div className="settings-skeleton settings-skeleton--card" key={index} />)}</div></main>;
}
