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

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inlineHtml = (s: string) => inlineRuns(s).map((r) => (r.bold ? `<strong>${esc(r.text)}</strong>` : esc(r.text))).join("");

/** Open the report in a clean page and the print dialog, where it can be saved as PDF. */
export function printReport(title: string, markdown: string, dateLabel: string) {
  let html = "";
  let list: "ul" | "ol" | null = null;
  const close = () => {
    if (list) html += `</${list}>`;
    list = null;
  };
  for (const blk of parseMarkdown(markdown)) {
    if (blk.kind === "bullet") {
      const want = blk.ordered ? "ol" : "ul";
      if (list !== want) {
        close();
        html += `<${want}>`;
        list = want;
      }
      html += `<li>${inlineHtml(blk.text)}</li>`;
      continue;
    }
    close();
    if (blk.kind === "heading") html += `<h${blk.level + 1}>${inlineHtml(blk.text)}</h${blk.level + 1}>`;
    else html += `<p>${inlineHtml(blk.text)}</p>`;
  }
  close();

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC","Helvetica Neue",Arial,sans-serif;color:#1f2a28;max-width:760px;margin:32px auto;padding:0 24px;line-height:1.7;font-size:14px}
  h1{font-size:22px;margin:0 0 4px} .date{color:#667;font-size:12px;margin-bottom:24px}
  h2{font-size:18px;margin:24px 0 8px} h3{font-size:16px;margin:20px 0 6px} h4{font-size:15px;margin:16px 0 6px}
  ul,ol{padding-left:22px} li{margin:4px 0} @page{margin:18mm}
</style></head><body><h1>${esc(title)}</h1><div class="date">${esc(dateLabel)}</div>${html}
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body></html>`);
  w.document.close();
  return true;
}
