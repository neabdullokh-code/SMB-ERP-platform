import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

export const runtime = "nodejs";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"]);
const IMAGE_MIME_PREFIX = "image/";

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

    const qty = parseQtyLike(numberChunks[0]);
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

async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  const module = await import("pdf-parse");
  const parser = new module.PDFParse({ data: fileBuffer });
  try {
    const result = await parser.getText();
    return normalizeText(result.text || "");
  } finally {
    await parser.destroy();
  }
}

async function extractTextFromImage(fileBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker("eng+rus");
  try {
    const result = await worker.recognize(fileBuffer);
    return {
      text: normalizeText(result.data.text || ""),
      confidence: Number.isFinite(result.data.confidence) ? result.data.confidence : 85
    };
  } finally {
    await worker.terminate();
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "File is required." }, { status: 400 });
    }

    const filename = file.name || "upload";
    const ext = fileExtension(filename);
    const mime = file.type || "";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text = "";
    let confidence = 85;

    if (mime.startsWith(IMAGE_MIME_PREFIX) || IMAGE_EXTENSIONS.has(ext)) {
      const result = await extractTextFromImage(buffer);
      text = result.text;
      confidence = result.confidence;
    } else if (ext === ".pdf" || mime === "application/pdf") {
      text = await extractTextFromPdf(buffer);
      confidence = 82;
    } else {
      return NextResponse.json(
        { message: "Unsupported file type for OCR. Use PDF, JPG, PNG, WEBP, or TIFF." },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { message: "No readable text extracted from document." },
        { status: 422 }
      );
    }

    const fields = extractFields(text, confidence, filename);
    const items = extractItems(text, confidence);

    return NextResponse.json({
      data: {
        fields,
        items,
        textPreview: text.slice(0, 2000)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to process OCR request." },
      { status: 500 }
    );
  }
}
