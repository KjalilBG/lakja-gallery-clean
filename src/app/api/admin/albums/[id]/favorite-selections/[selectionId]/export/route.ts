import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

import { getFavoriteSelectionExport, readPhotoBinary } from "@/lib/albums";
import { ensureAdminApiRequest } from "@/lib/auth-guard";
import { formatDate } from "@/lib/format";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 42;
const CARD_HEIGHT = 126;
const CARD_GAP = 16;
const THUMB_WIDTH = 132;
const THUMB_HEIGHT = 88;
const THUMB_PADDING = 6;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; selectionId: string }> }
) {
  const unauthorizedResponse = await ensureAdminApiRequest();
  if (unauthorizedResponse) return unauthorizedResponse;

  const { id, selectionId } = await params;
  const selection = await getFavoriteSelectionExport(selectionId, id);

  if (!selection) {
    return NextResponse.json({ ok: false, error: "Seleccion no encontrada." }, { status: 404 });
  }

  const pdf = await PDFDocument.create();
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);

  let cursorY = PAGE_HEIGHT - MARGIN;

  page.drawText(`Favoritas de ${selection.clientName}`, {
    x: MARGIN,
    y: cursorY,
    size: 22,
    font: boldFont,
    color: rgb(0.07, 0.09, 0.15)
  });

  cursorY -= 28;

  const headerLines = [
    `Album: ${selection.albumTitle}`,
    `Fecha: ${formatDate(selection.createdAt.toISOString())}`,
    selection.whatsapp ? `WhatsApp: ${selection.whatsapp}` : null,
    selection.message ? `Mensaje: ${selection.message}` : null,
    "Usa esta hoja para localizar rapido la seleccion final."
  ].filter(Boolean) as string[];

  for (const line of headerLines) {
    page.drawText(line, {
      x: MARGIN,
      y: cursorY,
      size: 10,
      font: regularFont,
      color: rgb(0.35, 0.39, 0.47)
    });
    cursorY -= 16;
  }

  cursorY -= 10;

  for (const photo of selection.photos) {
    if (cursorY - CARD_HEIGHT < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      cursorY = PAGE_HEIGHT - MARGIN;
    }

    page.drawRectangle({
      x: MARGIN,
      y: cursorY - CARD_HEIGHT,
      width: PAGE_WIDTH - MARGIN * 2,
      height: CARD_HEIGHT,
      borderWidth: 1,
      borderColor: rgb(0.89, 0.91, 0.94),
      color: rgb(0.99, 0.99, 0.995)
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
        .jpeg({ quality: 82 })
        .toBuffer();
      const embedded = await pdf.embedJpg(jpegBuffer);
      const imageScale = Math.min(
        (THUMB_WIDTH - THUMB_PADDING * 2) / embedded.width,
        (THUMB_HEIGHT - THUMB_PADDING * 2) / embedded.height
      );
      const drawWidth = embedded.width * imageScale;
      const drawHeight = embedded.height * imageScale;
      const imageBoxX = MARGIN + 14;
      const imageBoxY = cursorY - 102;

      page.drawRectangle({
        x: imageBoxX,
        y: imageBoxY,
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
        borderWidth: 1,
        borderColor: rgb(0.91, 0.93, 0.96),
        color: rgb(1, 1, 1)
      });

      page.drawImage(embedded, {
        x: imageBoxX + (THUMB_WIDTH - drawWidth) / 2,
        y: imageBoxY + (THUMB_HEIGHT - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight
      });
    } catch {
      page.drawRectangle({
        x: MARGIN + 14,
        y: cursorY - 102,
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
        color: rgb(0.94, 0.95, 0.97)
      });
      page.drawText("Sin miniatura", {
        x: MARGIN + 42,
        y: cursorY - 60,
        size: 9,
        font: boldFont,
        color: rgb(0.49, 0.53, 0.6)
      });
    }

    page.drawText(`#${photo.serial}`, {
      x: MARGIN + THUMB_WIDTH + 32,
      y: cursorY - 28,
      size: 13,
      font: boldFont,
      color: rgb(0.08, 0.1, 0.18)
    });

    page.drawText(photo.platformName, {
      x: MARGIN + THUMB_WIDTH + 32,
      y: cursorY - 50,
      size: 14,
      font: boldFont,
      color: rgb(0.08, 0.1, 0.18)
    });

    page.drawText(`Original: ${photo.originalName}`, {
      x: MARGIN + THUMB_WIDTH + 32,
      y: cursorY - 72,
      size: 10,
      font: regularFont,
      color: rgb(0.35, 0.39, 0.47)
    });

    cursorY -= CARD_HEIGHT + CARD_GAP;
  }

  const pdfBytes = await pdf.save();
  const fileName = `favoritas-${selection.clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "cliente"}-${selection.id}.pdf`;

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`
    }
  });
}
