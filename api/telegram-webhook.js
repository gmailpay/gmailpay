export default async function handler(req, res) {
  // Always return 200 for non-POST to prevent Telegram 405 errors
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

  const callbackData = callback.data || "";
  const colonIdx = callbackData.indexOf(":");
  if (colonIdx === -1) {
    await answer(BOT_TOKEN, callback.id, "Invalid action");
    return res.status(200).json({ ok: true });
  }

  const action = callbackData.slice(0, colonIdx);
  const docId = callbackData.slice(colonIdx + 1);

  if (!action || !docId) {
    await answer(BOT_TOKEN, callback.id, "Invalid action");
    return res.status(200).json({ ok: true });
  }

  const awHeaders = {
    "Content-Type": "application/json",
    "X-Appwrite-Project": PROJECT,
    "X-Appwrite-Key": APPWRITE_KEY,
  };

  try {
    if (action === "accept" || action === "reject") {
      // ── INDIVIDUAL ACCEPT / REJECT ──
      const status = action === "accept" ? "approved" : "rejected";
      const rejectionReason = action === "reject" ? "Rejected via Telegram" : "";

      const resp = await fetch(
        `${ENDPOINT}/databases/${DB}/collections/${COL}/documents/${docId}`,
        { method: "PATCH", headers: awHeaders, body: JSON.stringify({ data: { status, rejection_reason: rejectionReason } }) }
      );

      if (resp.ok) {
        const icon = status === "approved" ? "\u2705" : "\u274c";
        const label = status === "approved" ? "Approved" : "Rejected";
        const origText = callback.message?.text || "";
        const newText = origText.replace("\u23f3 Pending", `${icon} ${label}`);
        await editMsg(BOT_TOKEN, callback.message.chat.id, callback.message.message_id, newText);
        await answer(BOT_TOKEN, callback.id, `${icon} ${label}!`);
      } else {
        const err = await resp.json().catch(() => ({}));
        await answer(BOT_TOKEN, callback.id, `Error: ${err.message || "Update failed"}`);
      }

    } else if (action === "aa" || action === "ra") {
      // ── BATCH ACCEPT ALL / REJECT ALL ──
      const status = action === "aa" ? "approved" : "rejected";
      const rejectionReason = action === "ra" ? "Batch rejected via Telegram" : "";
      const icon = status === "approved" ? "\u2705" : "\u274c";
      const label = status === "approved" ? "Approved" : "Rejected";

      // 1. Get the document to find submitted_by
      const docResp = await fetch(
        `${ENDPOINT}/databases/${DB}/collections/${COL}/documents/${docId}`,
        { headers: { "X-Appwrite-Project": PROJECT, "X-Appwrite-Key": APPWRITE_KEY } }
      );

      if (!docResp.ok) {
        await answer(BOT_TOKEN, callback.id, "Could not find submission");
        return res.status(200).json({ ok: true });
      }

      const doc = await docResp.json();
      const submittedBy = doc.submitted_by;

      // 2. List all pending submissions by this user
      const queries = [
        JSON.stringify({ method: "equal", attribute: "submitted_by", values: [submittedBy] }),
        JSON.stringify({ method: "equal", attribute: "status", values: ["pending"] }),
        JSON.stringify({ method: "limit", values: [100] }),
      ];
      const qs = queries.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");

      const listResp = await fetch(
        `${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${qs}`,
        { headers: { "X-Appwrite-Project": PROJECT, "X-Appwrite-Key": APPWRITE_KEY } }
      );

      if (!listResp.ok) {
        await answer(BOT_TOKEN, callback.id, "Could not list submissions");
        return res.status(200).json({ ok: true });
      }

      const listData = await listResp.json();
      const pendingDocs = listData.documents || [];

      if (pendingDocs.length === 0) {
        await answer(BOT_TOKEN, callback.id, "No pending submissions for this user");
        return res.status(200).json({ ok: true });
      }

      // 3. Update all pending submissions
      let ok = 0;
      let fail = 0;
      for (const pd of pendingDocs) {
        try {
          const ur = await fetch(
            `${ENDPOINT}/databases/${DB}/collections/${COL}/documents/${pd.$id}`,
            { method: "PATCH", headers: awHeaders, body: JSON.stringify({ data: { status, rejection_reason: rejectionReason } }) }
          );
          if (ur.ok) ok++;
          else fail++;
        } catch {
          fail++;
        }
      }

      // 4. Update the Telegram message
      const origText = callback.message?.text || "";
      const newText = origText.replace("\u23f3 Pending", `${icon} Batch ${label}`)
        + `\n\n\ud83d\udcca ${ok} ${label.toLowerCase()}${fail > 0 ? `, ${fail} failed` : ""}`;

      await editMsg(BOT_TOKEN, callback.message.chat.id, callback.message.message_id, newText);
      await answer(BOT_TOKEN, callback.id, `${icon} Batch ${label}: ${ok} submissions!`);

    } else {
      await answer(BOT_TOKEN, callback.id, "Unknown action");
    }
  } catch (err) {
    console.error("Webhook error:", err);
    await answer(BOT_TOKEN, callback.id, `Error: ${err.message}`);
  }

  return res.status(200).json({ ok: true });
}

async function answer(token, cbId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: cbId, text, show_alert: true }),
    });
  } catch (e) {
    console.error("answer error:", e);
  }
}

async function editMsg(token, chatId, msgId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: msgId,
        text,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] },
      }),
    });
  } catch (e) {
    console.error("editMsg error:", e);
  }
}
