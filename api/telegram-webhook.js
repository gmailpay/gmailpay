export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  const update = req.body;
  const callback = update?.callback_query;

  if (!callback) return res.status(200).json({ ok: true });

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const APPWRITE_KEY = process.env.APPWRITE_API_KEY;
  const ENDPOINT = "https://fra.cloud.appwrite.io/v1";
  const PROJECT = "69c48422001e3dc03352";
  const DB = "gmailpay";
  const COL = "gmail_submissions";

  const [action, docId] = (callback.data || "").split(":");

  if (!action || !docId) {
    await answer(BOT_TOKEN, callback.id, "Invalid action");
    return res.status(200).json({ ok: true });
  }

  const status = action === "accept" ? "approved" : "rejected";
  const rejectionReason = action === "reject" ? "Rejected via Telegram" : "";

  try {
    const resp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents/${docId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": PROJECT,
        "X-Appwrite-Key": APPWRITE_KEY,
      },
      body: JSON.stringify({ data: { status, rejection_reason: rejectionReason } })
    });

    if (resp.ok) {
      const icon = status === "approved" ? "\u2705" : "\u274c";
      const label = status === "approved" ? "Approved" : "Rejected";
      const originalText = callback.message?.text || "";
      const newText = originalText.replace("\u23f3 Pending", `${icon} ${label}`);

      await editMsg(BOT_TOKEN, callback.message.chat.id, callback.message.message_id, newText);
      await answer(BOT_TOKEN, callback.id, `${icon} ${label}!`);
    } else {
      const err = await resp.json();
      await answer(BOT_TOKEN, callback.id, `Error: ${err.message || "Update failed"}`);
    }
  } catch (err) {
    await answer(BOT_TOKEN, callback.id, `Error: ${err.message}`);
  }

  return res.status(200).json({ ok: true });
}

async function answer(token, cbId, text) {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: cbId, text, show_alert: true })
  });
}

async function editMsg(token, chatId, msgId, text) {
  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: msgId,
      text,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [] }
    })
  });
}
