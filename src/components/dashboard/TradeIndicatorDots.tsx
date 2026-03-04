"use client";

export function TradeIndicatorDots({ tradeCount }: { tradeCount: number }) {
  if (tradeCount <= 0) {
    return null;
  }

  const dots = tradeCount <= 2 ? 1 : 3;

  return (
    <div className="mt-1 flex items-center gap-1">
      {Array.from({ length: dots }).map((_, i) => (
        <span key={i} className="h-1 w-1 rounded-full bg-white/70 dark:bg-white/80" />
      ))}
      {tradeCount >= 6 ? <span className="ml-1 text-[10px] font-semibold">{tradeCount}</span> : null}
    </div>
  );
}

export default TradeIndicatorDots;
