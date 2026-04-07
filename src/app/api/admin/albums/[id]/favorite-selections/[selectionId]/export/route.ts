import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { NextResponse } from "next/server";

import { getFavoriteSelectionExport, readPhotoBinary } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { formatDate } from "@/lib/format";
import { checkRateLimit } from "@/lib/rate-limit";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 42;
const GUTTER = 18;
const CARD_HEIGHT = 106;
const CARD_WIDTH = (PAGE_WIDTH - MARGIN * 2 - GUTTER) / 2;
const THUMB_WIDTH = 72;
const THUMB_HEIGHT = 72;
const PAGE_NUMBER_SIZE = 9;

function slugifyFileName(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cliente";
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    lineHeight: number;
    size: number;
    font: PDFFont;
    color: ReturnType<typeof rgb>;
    maxLines?: number;
  }
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const candidateWidth = options.font.widthOfTextAtSize(candidate, options.size);

    if (candidateWidth <= options.maxWidth || !currentLine) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;

    if (options.maxLines && lines.length >= options.maxLines) {
      break;
    }
  }

  if (currentLine && (!options.maxLines || lines.length < options.maxLines)) {
    lines.push(currentLine);
  }

  const visibleLines = options.maxLines ? lines.slice(0, options.maxLines) : lines;

  visibleLines.forEach((line, index) => {
    page.drawText(line, {
      x: options.x,
      y: options.y - index * options.lineHeight,
      size: options.size,
      font: options.font,
      color: options.color
    });
  });
}

function drawLabelChip(
  page: PDFPage,
  label: string,
  x: number,
  y: number,
  font: PDFFont,
  fill: ReturnType<typeof rgb>,
  textColor: ReturnType<typeof rgb>
) {
  const width = Math.max(78, font.widthOfTextAtSize(label, 9) + 22);
  page.drawRectangle({
    x,
    y,
    width,
    height: 20,
    color: fill
  });
  page.drawText(label, {
    x: x + 11,
    y: y + 6,
    size: 9,
    font,
    color: textColor
  });
  return width;
}

async function drawPhotoCard(
  pdf: PDFDocument,
  page: PDFPage,
  photo: {
    serial: number;
    platformName: string;
    originalName: string;
    originalKey: string;
    previewKey: string | null;
    thumbKey: string | null;
  },
  originX: number,
  originY: number,
  boldFont: PDFFont,
  regularFont: PDFFont
) {
  page.drawRectangle({
    x: originX,
    y: originY - CARD_HEIGHT,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    color: rgb(0.99, 0.99, 0.995),
    borderWidth: 1,
    borderColor: rgb(0.9, 0.92, 0.95)
  });

  page.drawRectangle({
    x: originX + 16,
    y: originY - 88,
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    color: rgb(1, 1, 1),
    borderWidth: 1,
    borderColor: rgb(0.91, 0.93, 0.96)
  });

  try {
    const sourceKey = photo.thumbKey ?? photo.previewKey ?? photo.originalKey;
    const { body } = await readPhotoBinary(sourceKey);
    const jpegBuffer = await sharp(body)
      .rotate()
      .resize(THUMB_WIDTH * 3, THUMB_HEIGHT * 3, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: 84 })
      .toBuffer();

    const embedded = await pdf.embedJpg(jpegBuffer);
    const imageScale = Math.min(THUMB_WIDTH / embedded.width, THUMB_HEIGHT / embedded.height);
    const drawWidth = embedded.width * imageScale;
      const drawHeight = embedded.height * imageScale;

      page.drawImage(embedded, {
        x: originX + 16 + (THUMB_WIDTH - drawWidth) / 2,
        y: originY - 88 + (THUMB_HEIGHT - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight
      });
    } catch {
      page.drawText("Sin miniatura", {
        x: originX + 24,
        y: originY - 50,
        size: 8,
        font: boldFont,
        color: rgb(0.5, 0.54, 0.6)
      });
    }

  page.drawText(`Foto #${photo.serial}`, {
    x: originX + 104,
    y: originY - 24,
    size: 11,
    font: boldFont,
    color: rgb(0.09, 0.11, 0.18)
  });

  drawWrappedText(page, photo.platformName, {
    x: originX + 104,
    y: originY - 42,
    maxWidth: CARD_WIDTH - 120,
    lineHeight: 13,
    size: 10,
    font: boldFont,
    color: rgb(0.09, 0.11, 0.18),
    maxLines: 2
  });

  page.drawText("Original", {
    x: originX + 104,
    y: originY - 74,
    size: 7,
    font: boldFont,
    color: rgb(0.45, 0.49, 0.57)
  });

  drawWrappedText(page, photo.originalName, {
    x: originX + 104,
    y: originY - 84,
    maxWidth: CARD_WIDTH - 120,
    lineHeight: 10,
    size: 7.5,
    font: regularFont,
    color: rgb(0.36, 0.4, 0.47),
    maxLines: 2
  });
}

function drawPageNumber(page: PDFPage, text: string, font: PDFFont) {
  const textWidth = font.widthOfTextAtSize(text, PAGE_NUMBER_SIZE);
  page.drawText(text, {
    x: PAGE_WIDTH - MARGIN - textWidth,
    y: 22,
    size: PAGE_NUMBER_SIZE,
    font,
    color: rgb(0.52, 0.56, 0.63)
  });
}

async function buildSelectionPdf(
  pdf: PDFDocument,
  selection: NonNullable<Awaited<ReturnType<typeof getFavoriteSelectionExport>>>,
  boldFont: PDFFont,
  regularFont: PDFFont
) {
  const cover = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  cover.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(0.985, 0.988, 0.995)
  });

  cover.drawRectangle({
    x: MARGIN,
    y: PAGE_HEIGHT - 182,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 140,
    color: rgb(0.95, 0.98, 0.9)
  });

  cover.drawText("LA KJA", {
    x: MARGIN,
    y: PAGE_HEIGHT - 64,
    size: 13,
    font: boldFont,
    color: rgb(0.36, 0.4, 0.47)
  });

  cover.drawText("Seleccion de favoritas", {
    x: MARGIN,
    y: PAGE_HEIGHT - 126,
    size: 34,
    font: boldFont,
    color: rgb(0.08, 0.1, 0.18)
  });

  cover.drawText(selection.clientName, {
    x: MARGIN,
    y: PAGE_HEIGHT - 164,
    size: 22,
    font: regularFont,
    color: rgb(0.32, 0.36, 0.44)
  });

  let chipX = MARGIN;
  chipX += drawLabelChip(cover, formatDate(selection.createdAt.toISOString()), chipX, PAGE_HEIGHT - 220, boldFont, rgb(1, 1, 1), rgb(0.33, 0.37, 0.45)) + 10;
  chipX += drawLabelChip(cover, `${selection.photos.length} fotos`, chipX, PAGE_HEIGHT - 220, boldFont, rgb(1, 1, 1), rgb(0.33, 0.37, 0.45)) + 10;
  if (selection.whatsapp) {
    drawLabelChip(cover, selection.whatsapp, chipX, PAGE_HEIGHT - 220, boldFont, rgb(1, 1, 1), rgb(0.33, 0.37, 0.45));
  }

  cover.drawText("Album", {
    x: MARGIN,
    y: PAGE_HEIGHT - 284,
    size: 10,
    font: boldFont,
    color: rgb(0.52, 0.56, 0.63)
  });

  cover.drawText(selection.albumTitle, {
    x: MARGIN,
    y: PAGE_HEIGHT - 306,
    size: 20,
    font: boldFont,
    color: rgb(0.08, 0.1, 0.18)
  });

  if (selection.message?.trim()) {
    cover.drawText("Mensaje del cliente", {
      x: MARGIN,
      y: PAGE_HEIGHT - 360,
      size: 10,
      font: boldFont,
      color: rgb(0.52, 0.56, 0.63)
    });

    drawWrappedText(cover, selection.message.trim(), {
      x: MARGIN,
      y: PAGE_HEIGHT - 382,
      maxWidth: PAGE_WIDTH - MARGIN * 2 - 20,
      lineHeight: 17,
      size: 13,
      font: regularFont,
      color: rgb(0.28, 0.32, 0.4),
      maxLines: 4
    });
  } else {
    cover.drawText("Resumen listo para localizar y trabajar la seleccion final.", {
      x: MARGIN,
      y: PAGE_HEIGHT - 382,
      size: 13,
      font: regularFont,
      color: rgb(0.28, 0.32, 0.4)
    });
  }

  cover.drawText("Preparado para revisar, editar y cerrar entrega.", {
    x: MARGIN,
    y: 44,
    size: 10,
    font: boldFont,
    color: rgb(0.52, 0.56, 0.63)
  });

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - MARGIN;
  let column = 0;

  page.drawText("Favoritas seleccionadas", {
    x: MARGIN,
    y: cursorY,
    size: 18,
    font: boldFont,
    color: rgb(0.08, 0.1, 0.18)
  });

  cursorY -= 24;

  for (const photo of selection.photos) {
    if (cursorY - CARD_HEIGHT < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      cursorY = PAGE_HEIGHT - MARGIN;
      column = 0;
    }

    const cardX = column === 0 ? MARGIN : MARGIN + CARD_WIDTH + GUTTER;
    await drawPhotoCard(pdf, page, photo, cardX, cursorY, boldFont, regularFont);

    if (column === 0) {
      column = 1;
    } else {
      column = 0;
      cursorY -= CARD_HEIGHT + GUTTER;
    }
  }

  let summaryPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let summaryY = PAGE_HEIGHT - MARGIN;

  summaryPage.drawText("Lista resumen", {
    x: MARGIN,
    y: summaryY,
    size: 18,
    font: boldFont,
    color: rgb(0.08, 0.1, 0.18)
  });

  summaryY -= 28;

  summaryPage.drawText("#", {
    x: MARGIN,
    y: summaryY,
    size: 9,
    font: boldFont,
    color: rgb(0.45, 0.49, 0.57)
  });
  summaryPage.drawText("Nombre en plataforma", {
    x: MARGIN + 40,
    y: summaryY,
    size: 9,
    font: boldFont,
    color: rgb(0.45, 0.49, 0.57)
  });
  summaryPage.drawText("Nombre original", {
    x: MARGIN + 300,
    y: summaryY,
    size: 9,
    font: boldFont,
    color: rgb(0.45, 0.49, 0.57)
  });

  summaryY -= 16;

  for (const photo of selection.photos) {
    if (summaryY < MARGIN + 24) {
      summaryPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      summaryY = PAGE_HEIGHT - MARGIN;
      summaryPage.drawText("Lista resumen", {
        x: MARGIN,
        y: summaryY,
        size: 18,
        font: boldFont,
        color: rgb(0.08, 0.1, 0.18)
      });
      summaryY -= 28;
      summaryPage.drawText("#", {
        x: MARGIN,
        y: summaryY,
        size: 9,
        font: boldFont,
        color: rgb(0.45, 0.49, 0.57)
      });
      summaryPage.drawText("Nombre en plataforma", {
        x: MARGIN + 40,
        y: summaryY,
        size: 9,
        font: boldFont,
        color: rgb(0.45, 0.49, 0.57)
      });
      summaryPage.drawText("Nombre original", {
        x: MARGIN + 300,
        y: summaryY,
        size: 9,
        font: boldFont,
        color: rgb(0.45, 0.49, 0.57)
      });
      summaryY -= 16;
    }

    summaryPage.drawText(String(photo.serial), {
      x: MARGIN,
      y: summaryY,
      size: 9,
      font: boldFont,
      color: rgb(0.18, 0.22, 0.3)
    });

    drawWrappedText(summaryPage, photo.platformName, {
      x: MARGIN + 40,
      y: summaryY,
      maxWidth: 230,
      lineHeight: 11,
      size: 8.5,
      font: boldFont,
      color: rgb(0.18, 0.22, 0.3),
      maxLines: 2
    });

    drawWrappedText(summaryPage, photo.originalName, {
      x: MARGIN + 300,
      y: summaryY,
      maxWidth: PAGE_WIDTH - MARGIN - (MARGIN + 300),
      lineHeight: 11,
      size: 8.5,
      font: regularFont,
      color: rgb(0.36, 0.4, 0.47),
      maxLines: 2
    });

    summaryY -= 24;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; selectionId: string }> }
) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const rateLimitResponse = checkRateLimit(request, {
    label: "admin-favorite-export",
    maxRequests: 12,
    windowMs: 60 * 1000
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { id, selectionId } = await params;
  const selection = await getFavoriteSelectionExport(selectionId, id);

  if (!selection) {
    return NextResponse.json({ ok: false, error: "Seleccion no encontrada." }, { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  await buildSelectionPdf(pdf, selection, boldFont, regularFont);

  const pages = pdf.getPages();
  pages.forEach((pdfPage, index) => {
    drawPageNumber(pdfPage, `${index + 1} / ${pages.length}`, regularFont);
  });

  const pdfBytes = await pdf.save();
  const fileName = `favoritas-${slugifyFileName(selection.clientName)}-${selection.id}.pdf`;

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`
    }
  });
}
