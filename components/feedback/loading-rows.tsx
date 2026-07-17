interface LoadingRowsProps {
  readonly count?: number;
}

export function LoadingRows({ count = 3 }: LoadingRowsProps) {
  return (
    <div className="loading-rows" aria-label="목록을 불러오는 중" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="loading-row" key={index}>
          <span className="skeleton skeleton--square" />
          <span className="skeleton" />
          <span className="skeleton skeleton--short" />
        </div>
      ))}
    </div>
  );
}
