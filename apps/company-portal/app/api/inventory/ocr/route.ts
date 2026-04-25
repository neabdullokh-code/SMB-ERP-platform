import { execFile } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"]);
const IMAGE_MIME_PREFIX = "image/";
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const TESSERACT_CACHE_DIR = path.join(os.tmpdir(), "smb-erp-tesseract-cache");
const OCR_CONCURRENCY = 1;

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;

let workerPromise: Promise<TesseractWorker> | null = null;
let inFlight = 0;
const waiters: Array<() => void> = [];

type OcrField = {
  field: string;
  val: string;
  conf: number;
};

type OcrItem = {
  sku: string;
  name: string;
  qty: number;
  price: number;
  conf: number;
};

type OcrExtractResult = {
  text: string;
  confidence: number;
  warnings: string[];
};

class OcrInputError extends Error {
  status: number;

  constructor(message: string, status = 422) {
    super(message);
    this.name = "OcrInputError";
    this.status = status;
  }
}

function resolveTesseractNodeWorker() {
  const rel = path.join("node_modules", "tesseract.js", "src", "worker-script", "node", "index.js");
  let current = process.cwd();

  for (let i = 0; i < 6; i += 1) {
    const candidate = path.resolve(current, rel);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error("Unable to locate tesseract.js node worker script.");
}

const TESSERACT_NODE_WORKER = resolveTesseractNodeWorker();

function fileExtension(name: string) {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx).toLowerCase();
}

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseMoneyLike(value: string) {
  const normalized = value.replace(/[^\d.,-]/g, "").replace(/\s+/g, "");
  if (!normalized) return 0;
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  let canonical = normalized;

  if (lastComma > lastDot) {
    canonical = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    canonical = normalized.replace(/,/g, "");
  }

  const parsed = Number.parseFloat(canonical);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseQtyLike(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractFields(text: string, confidence: number, filename: string): OcrField[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const flat = lines.join(" ");

  const supplierMatch =
    lines.find((line) => /^supplier[:\s]/i.test(line)) ??
    lines.find((line) => /^vendor[:\s]/i.test(line)) ??
    lines.find((line) => /^from[:\s]/i.test(line));
  const supplier = supplierMatch ? supplierMatch.replace(/^[^:]*:\s*/i, "").trim() : "From uploaded document";

  const docMatch = flat.match(/\b(?:WB|WAYBILL|INVOICE|INV|DOC)[-:\s#]*([A-Z0-9-]{3,})\b/i);
  const documentNo = docMatch ? docMatch[1].toUpperCase() : filename.replace(/\.[^.]+$/, "");

  const isoDate = flat.match(/\b(20\d{2}[-./]\d{1,2}[-./]\d{1,2})\b/i);
  const euDate = flat.match(/\b(\d{1,2}[./-]\d{1,2}[./-]20\d{2})\b/);
  const textualDate = flat.match(/\b(\d{1,2}\s+[A-Za-z]{3,9}\s+20\d{2})\b/i);
  const dateValue = (isoDate?.[1] ?? euDate?.[1] ?? textualDate?.[1] ?? new Date().toISOString().slice(0, 10)).trim();

  const currency = /\bUSD\b/i.test(flat) ? "USD" : /\bEUR\b/i.test(flat) ? "EUR" : "UZS";
  const fieldConf = Math.max(60, Math.min(99, Math.round(confidence)));

  return [
    { field: "Supplier", val: supplier, conf: fieldConf },
    { field: "Document no.", val: documentNo, conf: fieldConf },
    { field: "Date", val: dateValue, conf: fieldConf },
    { field: "Currency", val: currency, conf: fieldConf }
  ];
}

function extractItems(text: string, confidence: number): OcrItem[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const items: OcrItem[] = [];
  const baseConf = Math.max(55, Math.min(99, Math.round(confidence)));

  for (const line of lines) {
    if (items.length >= 20) break;
    if (/^(supplier|vendor|date|currency|invoice|waybill|doc|total|subtotal|vat)\b/i.test(line)) continue;

    const skuMatch = line.match(/\b[A-Z]{1,5}-\d{2,6}\b/i);
    const numberChunks = line.match(/-?\d[\d\s.,]*/g) ?? [];
    if (numberChunks.length < 2) continue;

    const qty = parseQtyLike(numberChunks[0] ?? "");
    const priceChunk = numberChunks[numberChunks.length >= 3 ? 1 : numberChunks.length - 1] ?? "";
    const price = parseMoneyLike(priceChunk);
    if (qty <= 0 || price <= 0) continue;

    let name = line;
    if (skuMatch) name = name.replace(skuMatch[0], " ");
    numberChunks.forEach((chunk) => {
      name = name.replace(chunk, " ");
    });
    name = name.replace(/\s+/g, " ").trim();
    if (!name) name = "Extracted item";

    items.push({
      sku: skuMatch ? skuMatch[0].toUpperCase() : "?",
      name,
      qty,
      price,
      conf: baseConf
    });
  }

  return items;
}

async function withOcrQueue<T>(job: () => Promise<T>) {
  if (inFlight >= OCR_CONCURRENCY) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }

  inFlight += 1;
  try {
    return await job();
  } finally {
    inFlight -= 1;
    const next = waiters.shift();
    if (next) next();
  }
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng+rus", undefined, {
      workerPath: TESSERACT_NODE_WORKER,
      workerBlobURL: false,
      cachePath: TESSERACT_CACHE_DIR
    });
  }

  return workerPromise;
}

async function resetWorker() {
  if (!workerPromise) return;
  const current = workerPromise;
  workerPromise = null;
  try {
    const worker = await current;
    await worker.terminate();
  } catch {
    // Ignore termination failures while resetting bad worker state.
  }
}

function isCorruptImageError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("image file /input cannot be read") || msg.includes("error attempting to read image");
}

async function recognizeWithRetry(fileBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  let lastError: unknown = null;
  const psmModes = ["6", "11"] as const;

  for (const psm of psmModes) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const worker = await getWorker();
        await worker.setParameters({ tessedit_pageseg_mode: psm as never });
        const result = await worker.recognize(fileBuffer);
        const text = normalizeText(result.data.text || "");
        const confidence = Number.isFinite(result.data.confidence) ? result.data.confidence : 85;
        return { text, confidence };
      } catch (error) {
        lastError = error;
        await resetWorker();
      }
    }
  }

  if (isCorruptImageError(lastError)) {
    throw new OcrInputError("Uploaded image appears corrupted or unsupported. Please upload a clear PNG/JPG/PDF.");
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to run OCR recognition.");
}

async function extractTextFromImage(fileBuffer: Buffer): Promise<OcrExtractResult> {
  return withOcrQueue(async () => {
    const result = await recognizeWithRetry(fileBuffer);
    return {
      text: result.text,
      confidence: result.confidence,
      warnings: []
    };
  });
}

async function rasterizePdfFirstPage(fileBuffer: Buffer): Promise<Buffer | null> {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "smb-ocr-pdf-"));
  const inPdf = path.join(tmpDir, "input.pdf");
  const outPrefix = path.join(tmpDir, "page");
  const outPng = `${outPrefix}.png`;

  try {
    await fsp.writeFile(inPdf, fileBuffer);

    try {
      await execFileAsync("pdftoppm", ["-f", "1", "-singlefile", "-png", inPdf, outPrefix], { windowsHide: true });
      if (fs.existsSync(outPng)) return await fsp.readFile(outPng);
    } catch {
      // Fallback to ImageMagick if available.
    }

    try {
      await execFileAsync("magick", ["-density", "220", `${inPdf}[0]`, outPng], { windowsHide: true });
      if (fs.existsSync(outPng)) return await fsp.readFile(outPng);
    } catch {
      // Keep null fallback.
    }
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  }

  return null;
}

async function extractTextFromPdf(fileBuffer: Buffer): Promise<OcrExtractResult> {
  const module = await import("pdf-parse");
  const parser = new module.PDFParse({ data: fileBuffer });

  try {
    const parsed = await parser.getText();
    const text = normalizeText(parsed.text || "");
    if (text.length >= 40) {
      return {
        text,
        confidence: 82,
        warnings: []
      };
    }
  } finally {
    await parser.destroy();
  }

  const pageImage = await rasterizePdfFirstPage(fileBuffer);
  if (!pageImage) {
    throw new OcrInputError(
      "Scanned PDF detected. Install Poppler (pdftoppm) or ImageMagick on server for OCR fallback, or upload as image."
    );
  }

  const imageResult = await extractTextFromImage(pageImage);
  return {
    ...imageResult,
    warnings: ["PDF had no embedded text; OCR was run on rendered page image."]
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "File is required." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { message: `File is too large. Max upload is ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.` },
        { status: 413 }
      );
    }

    const filename = file.name || "upload";
    const ext = fileExtension(filename);
    const mime = file.type || "";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let result: OcrExtractResult;
    if (mime.startsWith(IMAGE_MIME_PREFIX) || IMAGE_EXTENSIONS.has(ext)) {
      result = await extractTextFromImage(buffer);
    } else if (ext === ".pdf" || mime === "application/pdf") {
      result = await extractTextFromPdf(buffer);
    } else {
      return NextResponse.json(
        { message: "Unsupported file type for OCR. Use PDF, JPG, PNG, WEBP, TIFF, or BMP." },
        { status: 400 }
      );
    }

    if (!result.text) {
      return NextResponse.json(
        { message: "No readable text extracted from document." },
        { status: 422 }
      );
    }

    const fields = extractFields(result.text, result.confidence, filename);
    const items = extractItems(result.text, result.confidence);

    return NextResponse.json({
      data: {
        fields,
        items,
        textPreview: result.text.slice(0, 2000),
        warnings: result.warnings
      }
    });
  } catch (error) {
    if (error instanceof OcrInputError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to process OCR request." },
      { status: 500 }
    );
  }
}
