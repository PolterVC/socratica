import * as pdfjsLib from "pdfjs-dist";

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ExtractedText {
  chunks: string[];
  pageCount: number;
}

export async function extractTextFromPDF(file: File): Promise<ExtractedText> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = "";
  const pageCount = pdf.numPages;

  // Extract text from all pages
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n\n";
  }

  // Chunk the text
  const chunks = chunkText(fullText, 1800, 0.1);

  return { chunks, pageCount };
}

function chunkText(text: string, maxChunkSize: number, overlapRatio: number): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  const overlapSize = Math.floor(maxChunkSize * overlapRatio);

  let currentChunk: string[] = [];
  let currentSize = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordSize = word.length + 1; // +1 for space

    if (currentSize + wordSize > maxChunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push(currentChunk.join(" "));

      // Keep overlap words for next chunk
      const overlapWords = Math.floor(currentChunk.length * overlapRatio);
      currentChunk = currentChunk.slice(-overlapWords);
      currentSize = currentChunk.join(" ").length;
    }

    currentChunk.push(word);
    currentSize += wordSize;
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}
