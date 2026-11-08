/**
 * Export a planning report (Markdown text) as a Word file or a printable page.
 * Both keep Chinese text intact; the old jsPDF export had no Chinese font.
 */

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "bullet"; text: string; ordered?: string }
  | { kind: "para"; text: string };

function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of md.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim() || /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) continue;
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      blocks.push({ kind: "heading", level: Math.min(h[1].length, 3) as 1 | 2 | 3, text: h[2] });
      continue;
    }
    const b = line.match(/^\s*[-*•]\s+(.*)$/);
    if (b) {
      blocks.push({ kind: "bullet", text: b[1] });
      continue;
    }
    const o = line.match(/^\s*(\d+)[.)、]\s+(.*)$/);
    if (o) {
      blocks.push({ kind: "bullet", text: o[2], ordered: o[1] });
      continue;
    }
    blocks.push({ kind: "para", text: line.trim() });
  }
  return blocks;
}

/** Split "**bold** text" into runs. */
function inlineRuns(text: string): { text: string; bold: boolean }[] {
  const out: { text: string; bold: boolean }[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith("**") && p.endsWith("**")) out.push({ text: p.slice(2, -2), bold: true });
    else out.push({ text: p.replace(/[*`]/g, ""), bold: false });
  }
  return out;
}

const safeName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, " ").trim() || "report";

export async function downloadReportDocx(title: string, markdown: string, dateLabel: string) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");
  const font = { ascii: "Calibri", hAnsi: "Calibri", eastAsia: "Microsoft YaHei", cs: "Calibri" };
  const run = (text: string, bold = false, size?: number) => new TextRun({ text, bold, font, size });

  const children = [
    new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.LEFT, children: [run(title, true, 36)] }),
    new Paragraph({ spacing: { after: 240 }, children: [run(dateLabel, false, 18)] }),
  ];
  for (const blk of parseMarkdown(markdown)) {
    if (blk.kind === "heading") {
      const level = blk.level === 1 ? HeadingLevel.HEADING_1 : blk.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      children.push(new Paragraph({ heading: level, spacing: { before: 240, after: 120 }, children: inlineRuns(blk.text).map((r) => run(r.text, true)) }));
    } else if (blk.kind === "bullet") {
      children.push(
        new Paragraph({
          ...(blk.ordered ? { indent: { left: 360 } } : { bullet: { level: 0 } }),
          spacing: { after: 80 },
          children: [...(blk.ordered ? [run(`${blk.ordered}. `)] : []), ...inlineRuns(blk.text).map((r) => run(r.text, r.bold))],
        }),
      );
    } else {
      children.push(new Paragraph({ spacing: { after: 120 }, children: inlineRuns(blk.text).map((r) => run(r.text, r.bold)) }));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font, size: 22 } } } },
    sections: [{ children }],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName(title)}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const EMOJI = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;

async function fontBase64(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/**
 * Wrap mixed Chinese/English text: Chinese may break between any two
 * characters, English only at spaces (jsPDF's own wrapping treats a run of
 * Chinese as one long word and breaks lines too early).
 */
function wrap(text: string, maxWidth: number, measure: (t: string) => number): string[] {
  const tokens = text.match(/[A-Za-z0-9@#&_'’.\-+/%$]+|\s+|./gu) ?? [];
  const lines: string[] = [];
  let line = "";
  for (const tok of tokens) {
    const next = line + tok;
    if (measure(next) <= maxWidth || !line.trim()) {
      line = next;
      continue;
    }
    lines.push(line.trimEnd());
    line = /^\s+$/.test(tok) ? "" : tok;
  }
  if (line.trim()) lines.push(line.trimEnd());
  // A single token wider than the line (e.g. a long URL) is split by characters.
  return lines.flatMap((l) => {
    if (measure(l) <= maxWidth) return [l];
    const parts: string[] = [];
    let cur = "";
    for (const ch of l) {
      if (measure(cur + ch) > maxWidth && cur) {
        parts.push(cur);
        cur = ch;
      } else cur += ch;
    }
    if (cur) parts.push(cur);
    return parts;
  });
}

let fontCache: Promise<[string, string]> | null = null;
const loadFonts = () =>
  (fontCache ??= Promise.all([
    fontBase64("/fonts/NotoSansSC-Regular-gb2312.ttf"),
    fontBase64("/fonts/NotoSansSC-Bold-gb2312.ttf"),
  ]).catch((e) => {
    fontCache = null;
    throw e;
  }));

/** Download the report as a PDF with an embedded Chinese font. */
export async function downloadReportPdf(title: string, markdown: string, dateLabel: string) {
  const [{ default: jsPDF }, [regular, bold]] = await Promise.all([import("jspdf"), loadFonts()]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.addFileToVFS("NotoSansSC-Regular.ttf", regular);
  doc.addFont("NotoSansSC-Regular.ttf", "NotoSC", "normal");
  doc.addFileToVFS("NotoSansSC-Bold.ttf", bold);
  doc.addFont("NotoSansSC-Bold.ttf", "NotoSC", "bold");

  const margin = 56;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const bottom = doc.internal.pageSize.getHeight() - margin;
  let y = margin;

  const write = (text: string, opts: { size: number; bold?: boolean; indent?: number; gapBefore?: number; gapAfter?: number; color?: number }) => {
    const clean = text
      .replace(EMOJI, "")
      .replace(/\$?\\rightarrow\$?/g, "→")
      .replace(/\$?\\leftarrow\$?/g, "←")
      .replace(/\*\*/g, "")
      .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1$2")
      .replace(/[`]/g, "")
      .trim();
    if (!clean) return;
    doc.setFont("NotoSC", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size);
    doc.setTextColor(opts.color ?? 30);
    const lineH = opts.size * 1.55;
    y += opts.gapBefore ?? 0;
    const lines = wrap(clean, width - (opts.indent ?? 0), (t) => doc.getTextWidth(t));
    for (const line of lines) {
      if (y + lineH > bottom) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin + (opts.indent ?? 0), y + opts.size);
      y += lineH;
    }
    y += opts.gapAfter ?? 0;
  };

  write(title, { size: 18, bold: true, gapAfter: 2 });
  write(dateLabel, { size: 9, color: 110, gapAfter: 14 });
  for (const blk of parseMarkdown(markdown)) {
    if (blk.kind === "heading") {
      write(blk.text, { size: blk.level === 1 ? 15 : blk.level === 2 ? 14 : 12, bold: true, gapBefore: 10, gapAfter: 4 });
    } else if (blk.kind === "bullet") {
      write(`${blk.ordered ? `${blk.ordered}.` : "•"} ${blk.text}`, { size: 10.5, indent: 12, gapAfter: 2 });
    } else {
      write(blk.text, { size: 10.5, gapAfter: 5 });
    }
  }
  doc.save(`${safeName(title)}.pdf`);
}
