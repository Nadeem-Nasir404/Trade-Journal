"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

function normalizeBase(symbol: string) {
  const up = symbol.toUpperCase();
  if (up.endsWith("USDT")) return up.replace(/USDT$/, "");
  if (up.endsWith("USD")) return up.replace(/USD$/, "");
  return up;
}

function getCandidateUrls(symbol: string) {
  const base = normalizeBase(symbol).toLowerCase();
  const ticker = normalizeBase(symbol).toUpperCase();
  return [
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/${base}.png`,
    `https://financialmodelingprep.com/image-stock/${ticker}.png`,
  ];
}

export function SymbolLogo({ symbol, size = 28 }: { symbol: string; size?: number }) {
  const urls = useMemo(() => getCandidateUrls(symbol), [symbol]);
  const [idx, setIdx] = useState(0);

  const label = normalizeBase(symbol).slice(0, 2);
  const src = urls[idx];
  const showImage = idx < urls.length;

  return (
    <span
      className="inline-flex items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          loader={({ src: imageSrc }) => imageSrc}
          src={src}
          alt={symbol}
          width={size}
          height={size}
          sizes={`${size}px`}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => {
            if (idx < urls.length - 1) {
              setIdx((v) => v + 1);
            } else {
              setIdx(urls.length);
            }
          }}
        />
      ) : (
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{label}</span>
      )}
    </span>
  );
}
