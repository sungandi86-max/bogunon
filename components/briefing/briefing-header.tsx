const dateLabel = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "long" });
const timeLabel = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false });

export function BriefingHeader({ today }: { readonly today: string }) {
  const date = new Date(`${today}T00:00:00+09:00`);
  return <header className="briefing-header"><div><h1 className="briefing-header__date"><span>{dateLabel.format(date)}</span><time className="briefing-header__time" suppressHydrationWarning>{timeLabel.format(new Date())}</time></h1></div></header>;
}
