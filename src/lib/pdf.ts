import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";
import { normalizeTextBlock } from "./text";

export const MAX_PDF_BYTES = 5 * 1024 * 1024;

export class ResumePdfError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid-type" | "empty-file" | "file-too-large" | "empty-text"
  ) {
    super(message);
    this.name = "ResumePdfError";
  }
}

const pdfWorkerUrl = pathToFileURL(
  join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")
).toString();

export async function extractTextFromPdf(file: File): Promise<string> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new ResumePdfError("Upload a PDF resume.", "invalid-type");
  }

  if (file.size === 0) {
    throw new ResumePdfError("The selected PDF is empty.", "empty-file");
  }

  if (file.size > MAX_PDF_BYTES) {
    throw new ResumePdfError("PDF must be 5 MB or smaller.", "file-too-large");
  }

  PDFParse.setWorker(pdfWorkerUrl);
  const parser = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
  let parsed: Awaited<ReturnType<PDFParse["getText"]>>;

  try {
    parsed = await parser.getText();
  } catch {
    throw new ResumePdfError("This PDF could not be parsed. Try a text-based resume PDF.", "empty-text");
  } finally {
    await parser.destroy();
  }

  const text = normalizeTextBlock(parsed.text.replace(/\n{3,}/g, "\n\n"));

  if (text.length < 40) {
    throw new ResumePdfError("This PDF does not contain enough extractable text.", "empty-text");
  }

  return text;
}
