import { detectBibsWithOcrSpace } from "@/lib/ocr-space";
import { detectBibsWithPaddleOcr } from "@/lib/paddle-ocr";

type BibDetectionResult = {
  parsedText: string;
  bibs: string[];
};

export async function detectBibs(buffer: Buffer, fileName: string): Promise<BibDetectionResult> {
  const provider = (process.env.BIB_OCR_PROVIDER || "ocrspace").toLowerCase();

  if (provider === "paddleocr") {
    const result = await detectBibsWithPaddleOcr(buffer, fileName);
    return {
      parsedText: result.text,
      bibs: result.bibs
    };
  }

  return detectBibsWithOcrSpace(buffer, fileName);
}
