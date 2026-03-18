import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import { buildBibOcrVariants, extractBibCandidates } from "@/lib/ocr-space";

type PaddleOcrResult = {
  text: string;
  bibs: string[];
};

function runPythonScript(imagePath: string) {
  const pythonCommand = process.env.PADDLE_OCR_PYTHON || "python";
  const scriptPath =
    process.env.PADDLE_OCR_SCRIPT_PATH || path.join(process.cwd(), "scripts", "paddle_bib_ocr.py");

  return new Promise<string>((resolve, reject) => {
    const child = spawn(pythonCommand, [scriptPath, imagePath], {
      cwd: process.cwd(),
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || "PaddleOCR no pudo ejecutarse."));
        return;
      }

      resolve(stdout.trim());
    });
  });
}

export async function detectBibsWithPaddleOcr(buffer: Buffer, fileName: string): Promise<PaddleOcrResult> {
  const variants = await buildBibOcrVariants(buffer, fileName);
  const tempDir = await mkdtemp(path.join(tmpdir(), "lakja-paddle-"));
  const combinedBibs = new Set<string>();
  const combinedTexts: string[] = [];

  try {
    for (const [index, variant] of variants.entries()) {
      const filePath = path.join(tempDir, `${index + 1}-${variant.name}`);
      await writeFile(filePath, variant.buffer);

      try {
        const raw = await runPythonScript(filePath);
        const parsed = JSON.parse(raw) as { text?: string; candidates?: string[]; error?: string };

        if (parsed.error) {
          throw new Error(parsed.error);
        }

        const text = parsed.text?.trim() ?? "";
        const candidates = Array.isArray(parsed.candidates) ? parsed.candidates : extractBibCandidates(text);

        if (text) {
          combinedTexts.push(text);
        }

        for (const bib of candidates) {
          if (typeof bib === "string" && bib.trim()) {
            combinedBibs.add(bib.trim());
          }
        }
      } catch {
        // Ignore variant failures and continue with other crops.
      }
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  return {
    text: combinedTexts.join("\n\n").trim(),
    bibs: Array.from(combinedBibs).slice(0, 10)
  };
}
