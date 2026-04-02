export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email_address, submitted_by, doc_id } = req.body;
  if (!email_address || !doc_id) return res.status(400).json({ error: "Missing fields" });

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const ENV_CHAT_IDS = (process.env.TELEGRAM_CHAT_IDS || "").split(",").filter(Boolean);
  const APPWRITE_KEY = process.env.APPWRITE_API_KEY;
  const ENDPOINT = "https://fra.cloud.appwrite.io/v1";
  const PROJECT = "69c48422001e3dc03352";
  const DB = "gmailpay";
  const COL = "gmail_submissions";
  const SUBS_COL = "telegram_subscribers";

  if (!BOT_TOKEN) return res.status(200).json({ skipped: true });

  const awReadHeaders = { "X-Appwrite-Project": PROJECT, "X-Appwrite-Key": APPWRITE_KEY };

  // Get ALL subscriber chat IDs from Appwrite
  let subscriberIds = [];
  try {
    const subsQ = [JSON.stringify({ method: "limit", values: [100] })];
    const subsQS = subsQ.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");
    const subsResp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${SUBS_COL}/documents?${subsQS}`, { headers: awReadHeaders });
    if (subsResp.ok) {
      const subsData = await subsResp.json();
      subscriberIds = (subsData.documents || []).map(d => d.chat_id);
    }
  } catch (err) { console.error("Subscriber fetch error:", err); }

  // Merge with env chat IDs (deduplicate)
  const allChatIds = [...new Set([...subscriberIds, ...ENV_CHAT_IDS.map(s => s.trim())])];

  if (allChatIds.length === 0) return res.status(200).json({ skipped: true });

  // Get batch context
  let pendingCount = 0, totalCount = 0;
  try {
    const pQ = [
      JSON.stringify({ method: "equal", attribute: "submitted_by", values: [submitted_by] }),
      JSON.stringify({ method: "equal", attribute: "status", values: ["pending"] }),
      JSON.stringify({ method: "limit", values: [1] }),
    ];
    const pQS = pQ.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");
    const pResp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${pQS}`, { headers: awReadHeaders });
    if (pResp.ok) pendingCount = (await pResp.json()).total || 0;

    const tQ = [
      JSON.stringify({ method: "equal", attribute: "submitted_by", values: [submitted_by] }),
      JSON.stringify({ method: "limit", values: [1] }),
    ];
    const tQS = tQ.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");
    const tResp = await fetch(`${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${tQS}`, { headers: awReadHeaders });
    if (tResp.ok) totalCount = (await tResp.json()).total || 0;
  } catch (err) { console.error("Batch context error:", err); }

  const batchLine = pendingCount > 1 ? `\n\n\ud83d\udce6 <b>Batch:</b> ${pendingCount} pending from this user (${totalCount} total)` : "";
  const text = `\ud83d\udce7 <b>New Gmail Submission</b>\n\n<b>Email:</b> ${email_address}\n<b>Submitted by:</b> ${submitted_by}\n<b>Status:</b> \u23f3 Pending${batchLine}`;

  const results = [];
  for (const chatId of allChatIds) {
    try {
      const keyboard = [[
        { text: "\u2705 Accept", callback_data: `accept:${doc_id}` },
        { text: "\u274c Reject", callback_data: `reject:${doc_id}` },
      ]];
      if (pendingCount > 1) {
        keyboard.push([
          { text: `\u2705 Accept All (${pendingCount})`, callback_data: `aa:${doc_id}` },
          { text: `\u274c Reject All (${pendingCount})`, callback_data: `ra:${doc_id}` },
        ]);
      }
      const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } })
      });
      const data = await resp.json();
      results.push({ chatId, ok: data.ok });
    } catch (err) { results.push({ chatId, ok: false }); }
  }

  return res.status(200).json({ success: true, results });
};
