export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  const update = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const APPWRITE_KEY = process.env.APPWRITE_API_KEY;
  const ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
  const PROJECT = "69e62b1e002805ef3412";
  const DB = "gmailpay";
  const COL = "gmail_submissions";
  const SUBS_COL = "telegram_subscribers";

  const awHeaders = {
    "Content-Type": "application/json",
    "X-Appwrite-Project": PROJECT,
    "X-Appwrite-Key": APPWRITE_KEY,
  };
  const awReadHeaders = { "X-Appwrite-Project": PROJECT, "X-Appwrite-Key": APPWRITE_KEY };

  // ── HANDLE /start COMMAND ──
  const msg = update?.message;
  if (msg?.text?.startsWith("/start")) {
    const chatId = String(msg.chat.id);
    const username = msg.from?.username || "";
    const firstName = msg.from?.first_name || "User";

    // Check if already subscribed
    const checkQ = [JSON.stringify({ method: "equal", attribute: "chat_id", values: [chatId] })];
    const checkQS = checkQ.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");
    const existing = await fetch(`${ENDPOINT}/databases/${DB}/collections/${SUBS_COL}/documents?${checkQS}`, { headers: awReadHeaders });
    const existingData = existing.ok ? await existing.json() : { total: 0 };

    if (existingData.total === 0) {
      // Register new subscriber
      await fetch(`${ENDPOINT}/databases/${DB}/collections/${SUBS_COL}/documents`, {
        method: "POST", headers: awHeaders,
        body: JSON.stringify({ documentId: "unique()", data: { chat_id: chatId, username, first_name: firstName } })
      });
    }

    // Send welcome message with permanent keyboard
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Welcome to GmailPay, ${firstName}! \u{1f44b}\n\nYou are now registered to receive Gmail submission notifications.\n\nWhen users submit Gmail accounts, you will see them here with Accept/Reject buttons.\n\nUse the buttons below for quick actions:`,
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            [{ text: "\ud83d\udccb Copy All Pending Mails" }],
            [{ text: "\ud83d\udcca Stats" }, { text: "\u23f3 Pending Count" }]
          ],
          resize_keyboard: true,
          is_persistent: true
        }
      })
    });

    return res.status(200).json({ ok: true });
  }


  // ── HANDLE PERMANENT KEYBOARD BUTTONS ──
  if (msg?.text === "\ud83d\udccb Copy All Pending Mails") {
    const chatId = String(msg.chat.id);
    try {
      const appQ = [
        JSON.stringify({ method: "equal", attribute: "status", values: ["pending"] }),
        JSON.stringify({ method: "limit", values: [500] }),
      ];
      const appQS = appQ.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");
      const appResp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${appQS}`, { headers: awReadHeaders });
      if (appResp.ok) {
        const appData = await appResp.json();
        const emails = (appData.documents || []).map(d => d.email_address).join("\n");
        const count = appData.documents?.length || 0;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: count > 0 ? `\ud83d\udccb <b>${count} Pending Emails:</b>\n\n<code>${emails}</code>\n\n(Tap to copy)` : "No pending emails yet.", parse_mode: "HTML" })
        });
      }
    } catch (err) { console.error("Copy mails error:", err); }
    return res.status(200).json({ ok: true });
  }

  if (msg?.text === "\ud83d\udcca Stats") {
    const chatId = String(msg.chat.id);
    try {
      const allQ = [JSON.stringify({ method: "limit", values: [1] })];
      const allQS = allQ.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");
      const allResp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${allQS}`, { headers: awReadHeaders });
      const total = allResp.ok ? (await allResp.json()).total : 0;
      
      const pQ = [JSON.stringify({ method: "equal", attribute: "status", values: ["pending"] }), JSON.stringify({ method: "limit", values: [1] })];
      const pQS = pQ.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");
      const pResp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${pQS}`, { headers: awReadHeaders });
      const pending = pResp.ok ? (await pResp.json()).total : 0;
      
      const aQ = [JSON.stringify({ method: "equal", attribute: "status", values: ["approved"] }), JSON.stringify({ method: "limit", values: [1] })];
      const aQS = aQ.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");
      const aResp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${aQS}`, { headers: awReadHeaders });
      const approved = aResp.ok ? (await aResp.json()).total : 0;
      
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: `\ud83d\udcca <b>GmailPay Stats</b>\n\n\ud83d\udce8 Total: ${total}\n\u23f3 Pending: ${pending}\n\u2705 Approved: ${approved}\n\u274c Rejected: ${total - pending - approved}\n\n\ud83d\udcb0 Amount: \u20A6${(approved * 300).toLocaleString()}`, parse_mode: "HTML" })
      });
    } catch (err) { console.error("Stats error:", err); }
    return res.status(200).json({ ok: true });
  }

  if (msg?.text === "\u23f3 Pending Count") {
    const chatId = String(msg.chat.id);
    try {
      const pQ = [JSON.stringify({ method: "equal", attribute: "status", values: ["pending"] }), JSON.stringify({ method: "limit", values: [1] })];
      const pQS = pQ.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");
      const pResp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${pQS}`, { headers: awReadHeaders });
      const pending = pResp.ok ? (await pResp.json()).total : 0;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: `\u23f3 <b>${pending} pending submissions</b>`, parse_mode: "HTML" })
      });
    } catch (err) { console.error("Pending count error:", err); }
    return res.status(200).json({ ok: true });
  }

  // ── HANDLE BUTTON CALLBACKS ──
  const callback = update?.callback_query;
  if (!callback) return res.status(200).json({ ok: true });

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

  try {
    if (action === "accept" || action === "reject") {
      const status = action === "accept" ? "approved" : "rejected";
      const rejectionReason = action === "reject" ? "Rejected via Telegram" : "";

      const resp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents/${docId}`, {
        method: "PATCH", headers: awHeaders,
        body: JSON.stringify({ data: { status, rejection_reason: rejectionReason } })
      });

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
      const status = action === "aa" ? "approved" : "rejected";
      const rejectionReason = action === "ra" ? "Batch rejected via Telegram" : "";
      const icon = status === "approved" ? "\u2705" : "\u274c";
      const label = status === "approved" ? "Approved" : "Rejected";

      const docResp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents/${docId}`, { headers: awReadHeaders });
      if (!docResp.ok) { await answer(BOT_TOKEN, callback.id, "Could not find submission"); return res.status(200).json({ ok: true }); }

      const doc = await docResp.json();
      const queries = [
        JSON.stringify({ method: "equal", attribute: "submitted_by", values: [doc.submitted_by] }),
        JSON.stringify({ method: "equal", attribute: "status", values: ["pending"] }),
        JSON.stringify({ method: "limit", values: [100] }),
      ];
      const qs = queries.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");
      const listResp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${qs}`, { headers: awReadHeaders });
      if (!listResp.ok) { await answer(BOT_TOKEN, callback.id, "Could not list submissions"); return res.status(200).json({ ok: true }); }

      const pendingDocs = (await listResp.json()).documents || [];
      if (pendingDocs.length === 0) { await answer(BOT_TOKEN, callback.id, "No pending submissions"); return res.status(200).json({ ok: true }); }

      let ok = 0, fail = 0;
      for (const pd of pendingDocs) {
        try {
          const ur = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents/${pd.$id}`, {
            method: "PATCH", headers: awHeaders, body: JSON.stringify({ data: { status, rejection_reason: rejectionReason } })
          });
          if (ur.ok) ok++; else fail++;
        } catch { fail++; }
      }

      const origText = callback.message?.text || "";
      const newText = origText.replace("\u23f3 Pending", `${icon} Batch ${label}`) + `\n\n\ud83d\udcca ${ok} ${label.toLowerCase()}${fail > 0 ? `, ${fail} failed` : ""}`;
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
  try { await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cbId, text, show_alert: true }) }); } catch (e) { console.error("answer error:", e); }
}

async function editMsg(token, chatId, msgId, text) {
  try { await fetch(`https://api.telegram.org/bot${token}/editMessageText`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, message_id: msgId, text, parse_mode: "HTML", reply_markup: { inline_keyboard: [] } }) }); } catch (e) { console.error("editMsg error:", e); }
}
