export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email_address, submitted_by, doc_id } = req.body;
  if (!email_address || !doc_id) return res.status(400).json({ error: "Missing fields" });

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_IDS = (process.env.TELEGRAM_CHAT_IDS || "").split(",").filter(Boolean);
  const APPWRITE_KEY = process.env.APPWRITE_API_KEY;
  const ENDPOINT = "https://fra.cloud.appwrite.io/v1";
  const PROJECT = "69c48422001e3dc03352";
  const DB = "gmailpay";
  const COL = "gmail_submissions";

  if (!BOT_TOKEN || CHAT_IDS.length === 0) return res.status(200).json({ skipped: true });

  // Get batch context: how many pending submissions does this user have?
  let pendingCount = 0;
  let totalCount = 0;
  try {
    const pendingQ = [
      JSON.stringify({ method: "equal", attribute: "submitted_by", values: [submitted_by] }),
      JSON.stringify({ method: "equal", attribute: "status", values: ["pending"] }),
      JSON.stringify({ method: "limit", values: [1] }),
    ];
    const pendingQS = pendingQ.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");

    const batchResp = await fetch(
      `${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${pendingQS}`,
      { headers: { "X-Appwrite-Project": PROJECT, "X-Appwrite-Key": APPWRITE_KEY } }
    );
    if (batchResp.ok) {
      const d = await batchResp.json();
      pendingCount = d.total || 0;
    }

    const totalQ = [
      JSON.stringify({ method: "equal", attribute: "submitted_by", values: [submitted_by] }),
      JSON.stringify({ method: "limit", values: [1] }),
    ];
    const totalQS = totalQ.map(q => `queries[]=${encodeURIComponent(q)}`).join("&");

    const totalResp = await fetch(
      `${ENDPOINT}/databases/${DB}/collections/${COL}/documents?${totalQS}`,
      { headers: { "X-Appwrite-Project": PROJECT, "X-Appwrite-Key": APPWRITE_KEY } }
    );
    if (totalResp.ok) {
      const d = await totalResp.json();
      totalCount = d.total || 0;
    }
  } catch (err) {
    console.error("Batch context error:", err);
  }

  const batchLine =
    pendingCount > 1
      ? `\n\n\ud83d\udce6 <b>Batch:</b> ${pendingCount} pending from this user (${totalCount} total)`
      : "";

  const text = `\ud83d\udce7 <b>New Gmail Submission</b>\n\n<b>Email:</b> ${email_address}\n<b>Submitted by:</b> ${submitted_by}\n<b>Status:</b> \u23f3 Pending${batchLine}`;

  const results = [];
  for (const chatId of CHAT_IDS) {
    try {
      const keyboard = [
        [
          { text: "\u2705 Accept", callback_data: `accept:${doc_id}` },
          { text: "\u274c Reject", callback_data: `reject:${doc_id}` },
        ],
      ];

      // Add batch buttons if there are multiple pending
      if (pendingCount > 1) {
        keyboard.push([
          { text: `\u2705 Accept All (${pendingCount})`, callback_data: `aa:${doc_id}` },
          { text: `\u274c Reject All (${pendingCount})`, callback_data: `ra:${doc_id}` },
        ]);
      }

      const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text,
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: keyboard },
        }),
      });
      const data = await resp.json();
      results.push({ chatId: chatId.trim(), ok: data.ok });
    } catch (err) {
      results.push({ chatId: chatId.trim(), ok: false, error: err.message });
    }
  }

  return res.status(200).json({ success: true, results });
};
