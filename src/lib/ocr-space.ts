import sharp from "sharp";

export function normalizeBib(value: string) {
  return value.replace(/\D+/g, "").trim();
}

export function extractBibCandidates(text: string) {
  const compactText = text
    .replace(/(\d)\s+(?=\d)/g, "$1")
    .replace(/[Oo]/g, "0")
    .replace(/[IiLl]/g, "1");

  const matches = compactText.match(/\b\d{2,6}\b/g) ?? [];
  const unique = Array.from(
    new Set(matches.map(normalizeBib).filter((value) => value.length >= 2 && value.length <= 6))
  );

  return unique.slice(0, 10);
}

type OcrSpaceParsedResult = {
  ParsedText?: string;
};

type OcrSpaceResponse = {
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string[] | string;
  ParsedResults?: OcrSpaceParsedResult[];
};

type Variant = {
  name: string;
  buffer: Buffer;
};

async function callOcrSpace(buffer: Buffer, fileName: string) {
  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    throw new Error("Configura OCR_SPACE_API_KEY para usar reconocimiento de bibs.");
  }

  const formData = new FormData();
  formData.append("apikey", apiKey);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("OCREngine", "2");
  formData.append("scale", "true");
  formData.append("detectOrientation", "true");
  formData.append("file", new File([new Uint8Array(buffer)], fileName, { type: "image/jpeg" }));

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: formData,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("OCR.space no respondio correctamente.");
  }

  const data = (await response.json()) as OcrSpaceResponse;

  if (data.IsErroredOnProcessing) {
    const message = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(", ") : data.ErrorMessage;
    throw new Error(message || "OCR.space no pudo procesar la imagen.");
  }

  return data.ParsedResults?.map((result) => result.ParsedText?.trim() ?? "").filter(Boolean).join("\n") ?? "";
}

async function buildVariant(
  buffer: Buffer,
  fileName: string,
  extract?: { left: number; top: number; width: number; height: number },
  threshold = 160
) {
  let pipeline = sharp(buffer).rotate();

  if (extract) {
    pipeline = pipeline.extract(extract);
  }

  const transformed = await pipeline
    .grayscale()
    .normalize()
    .sharpen()
    .linear(1.15, -8)
    .threshold(threshold)
    .resize({ width: 1600, withoutEnlargement: false, fit: "inside" })
    .jpeg({ quality: 90 })
    .toBuffer();

  return {
    name: fileName,
    buffer: transformed
  };
}

export async function buildBibOcrVariants(buffer: Buffer, fileName: string): Promise<Variant[]> {
  const metadata = await sharp(buffer).rotate().metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    return [await buildVariant(buffer, `${fileName}-full.jpg`)];
  }

  const zones = [
    null,
    {
      left: Math.round(width * 0.15),
      top: Math.round(height * 0.22),
      width: Math.round(width * 0.7),
      height: Math.round(height * 0.38)
    },
    {
      left: Math.round(width * 0.12),
      top: Math.round(height * 0.34),
      width: Math.round(width * 0.76),
      height: Math.round(height * 0.28)
    },
    {
      left: Math.round(width * 0.2),
      top: Math.round(height * 0.28),
      width: Math.round(width * 0.6),
      height: Math.round(height * 0.46)
    }
  ];

  const variants = await Promise.all(
    zones.map(async (zone, index) => buildVariant(buffer, `${fileName}-variant-${index + 1}.jpg`, zone ?? undefined, 148 + index * 6))
  );

  return variants;
}

export async function detectBibsWithOcrSpace(buffer: Buffer, fileName: string) {
  const variants = await buildBibOcrVariants(buffer, fileName);
  const combinedTexts: string[] = [];
  const combinedBibs = new Set<string>();

  for (const variant of variants) {
    try {
      const parsedText = await callOcrSpace(variant.buffer, variant.name);

      if (parsedText) {
        combinedTexts.push(parsedText);
        for (const bib of extractBibCandidates(parsedText)) {
          combinedBibs.add(bib);
        }
      }
    } catch {
      // Ignore individual variant failures and continue with the next crop.
    }
  }

  return {
    parsedText: combinedTexts.join("\n\n").trim(),
    bibs: Array.from(combinedBibs).slice(0, 10)
  };
}
