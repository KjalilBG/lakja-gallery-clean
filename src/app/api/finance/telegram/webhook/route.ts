import { NextResponse } from "next/server";

import { handleFinanceMessage } from "@/lib/finance/service";
import { buildReportTelegramMessage, buildTransactionConfirmation, sendTelegramMessage } from "@/lib/finance/telegram";

type TelegramWebhookPayload = {
  message?: {
    message_id?: number;
    text?: string;
    chat?: {
      id?: number | string;
      title?: string;
      username?: string;
    };
  };
};

export async function POST(request: Request) {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token")?.trim();

  if (configuredSecret && receivedSecret && receivedSecret !== configuredSecret) {
    console.warn("Finance Telegram webhook secret mismatch. Continuing request.");
  }

  let payload: TelegramWebhookPayload | null = null;
  let chatId: string | null = null;

  try {
    payload = (await request.json()) as TelegramWebhookPayload;
    const text = payload.message?.text?.trim();
    const payloadChatId = payload.message?.chat?.id;
    chatId = payloadChatId ? String(payloadChatId) : null;

    if (!text || !chatId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const result = await handleFinanceMessage({
      rawMessage: text,
      chatId,
      telegramMessageId: payload.message?.message_id ? String(payload.message.message_id) : undefined
    });

    if (result.kind === "help") {
      await sendTelegramMessage(chatId, result.message);
    } else if (result.kind === "report") {
      await sendTelegramMessage(chatId, await buildReportTelegramMessage(result.report));
    } else {
      await sendTelegramMessage(
        chatId,
        await buildTransactionConfirmation({
          owner: result.transaction.owner,
          type: result.transaction.type,
          amount: result.transaction.amount.toString(),
          description: result.transaction.description
        })
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar el mensaje.";
    const fallbackChatId = chatId ?? payload?.message?.chat?.id?.toString() ?? null;

    if (fallbackChatId) {
      await sendTelegramMessage(fallbackChatId, `⚠️ ${message}`).catch(() => null);
    }

    return NextResponse.json({ ok: true, handledError: true, error: message });
  }
}
