import path from "node:path";

import sharp from "sharp";

type ProcessedImageSet = {
  previewBuffer: Buffer;
  previewContentType: string;
  previewExtension: string;
  thumbBuffer: Buffer;
  thumbContentType: string;
  thumbExtension: string;
  width: number | null;
  height: number | null;
};

function resolveOutputFormat(contentType: string, fileName: string) {
  if (contentType === "image/png" || path.extname(fileName).toLowerCase() === ".png") {
    return { extension: ".png", contentType: "image/png" as const };
  }

  return { extension: ".jpg", contentType: "image/jpeg" as const };
}

export async function buildImageDerivatives(params: {
  buffer: Buffer;
  fileName: string;
  contentType?: string;
}): Promise<ProcessedImageSet> {
  const image = sharp(params.buffer, { failOn: "none" }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width ?? null;
  const height = metadata.height ?? null;
  const outputFormat = resolveOutputFormat(params.contentType ?? "", params.fileName);

  const previewPipeline = sharp(params.buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: 2200,
      height: 2200,
      fit: "inside",
      withoutEnlargement: true
    });

  const thumbPipeline = sharp(params.buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: 720,
      height: 720,
      fit: "cover",
      position: "centre"
    });

  const previewBuffer =
    outputFormat.contentType === "image/png"
      ? await previewPipeline.png({ compressionLevel: 8 }).toBuffer()
      : await previewPipeline.jpeg({ quality: 84, mozjpeg: true }).toBuffer();

  const thumbBuffer =
    outputFormat.contentType === "image/png"
      ? await thumbPipeline.png({ compressionLevel: 9 }).toBuffer()
      : await thumbPipeline.jpeg({ quality: 72, mozjpeg: true }).toBuffer();

  return {
    previewBuffer,
    previewContentType: outputFormat.contentType,
    previewExtension: outputFormat.extension,
    thumbBuffer,
    thumbContentType: outputFormat.contentType,
    thumbExtension: outputFormat.extension,
    width,
    height
  };
}
