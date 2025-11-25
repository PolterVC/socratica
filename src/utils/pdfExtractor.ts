import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Use bundled ESM worker via Vite ?url import to avoid external CDN issues
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker as string;

export async function extractTextFromPDF(file: File): Promise<{ chunks: string[]; pageCount: number }> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  let text = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => ("str" in it ? it.str : "")).filter(Boolean);
    text += strings.join(" ") + "\n\n";
    if (text.length > 500_000) break;
  }

  const chunks = chunkText(text, 1800, 200);
  return { chunks, pageCount: pdf.numPages };
}

function chunkText(src: string, size: number, overlap: number) {
  const clean = src.replace(/\s+/g, " ").trim();
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(clean.length, i + size);
    out.push(clean.slice(i, end));
    if (end === clean.length) break;
    i = end - overlap;
  }
  return out;
}
