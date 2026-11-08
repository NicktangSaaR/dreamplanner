import type { ReactNode } from "react";

/** Markdown styled without the typography plugin. */
export const MD = {
  h1: (p: { children?: ReactNode }) => <p className="pt-2 text-base font-semibold text-pine">{p.children}</p>,
  h2: (p: { children?: ReactNode }) => <p className="pt-2 text-base font-semibold text-pine">{p.children}</p>,
  h3: (p: { children?: ReactNode }) => <p className="pt-2 font-semibold text-pine">{p.children}</p>,
  h4: (p: { children?: ReactNode }) => <p className="pt-1 font-medium">{p.children}</p>,
  ul: (p: { children?: ReactNode }) => <ul className="list-disc space-y-1 pl-5">{p.children}</ul>,
  ol: (p: { children?: ReactNode }) => <ol className="list-decimal space-y-1 pl-5">{p.children}</ol>,
  strong: (p: { children?: ReactNode }) => <strong className="font-semibold">{p.children}</strong>,
  hr: () => <hr className="my-2" />,
  table: (p: { children?: ReactNode }) => <div className="overflow-x-auto"><table className="w-full border-collapse text-xs [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:bg-muted/40 [&_th]:px-2 [&_th]:py-1">{p.children}</table></div>,
};

