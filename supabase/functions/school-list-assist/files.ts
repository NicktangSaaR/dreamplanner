// Reading an uploaded school list.

/** Plain text from an uploaded school list. */
export async function fileText(name: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  if (bytes.length > 5 * 1024 * 1024) throw new Error("too large");
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "xlsx" || ext === "xls" || ext === "csv") {
    const XLSX = await import("npm:xlsx@0.18.5");
    const wb = XLSX.read(bytes, { type: "array" });
    return wb.SheetNames.map((n: string) => `# ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n], { blankrows: false })}`).join("\n\n");
  }
  if (ext === "docx") {
    const { default: JSZip } = await import("npm:jszip@3.10.1");
    const zip = await JSZip.loadAsync(bytes);
    const xml = (await zip.file("word/document.xml")?.async("string")) ?? "";
    return xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab\/>/g, "\t").replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  }
  if (ext === "pdf") {
    const { extractText, getDocumentProxy } = await import("npm:unpdf@0.12.1");
    const doc = await getDocumentProxy(bytes);
    const { text } = await extractText(doc, { mergePages: true });
    return String(text);
  }
  if (ext === "txt" || ext === "md") return new TextDecoder().decode(bytes);
  throw new Error(`unsupported: ${ext}`);
}
