export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email_address, submitted_by, doc_id } = req.body;
  if (!email_address || !doc_id) return res.status(400).json({ error: "Missing fields" });

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_IDS = (process.env.TELEGRAM_CHAT_IDS || "").split(",").filter(Boolean);

  if (!BOT_TOKEN || CHAT_IDS.length === 0) return res.status(200).json({ skipped: true });

  const text = `\u{1f4e7} <b>New Gmail Submission</b>\n\n<b>Email:</b> ${email_address}\n<b>Submitted by:</b> ${submitted_by}\n<b>Status:</b> \u23f3 Pending`;

  const results = [];
  for (const chatId of CHAT_IDS) {
    try {
      const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[
              { text: "\u2705 Accept", callback_data: `accept:${doc_id}` },
              { text: "\u274c Reject", callback_data: `reject:${doc_id}` }
            ]]
          }
        })
      });
      const data = await resp.json();
      results.push({ chatId: chatId.trim(), ok: data.ok });
    } catch (err) {
      results.push({ chatId: chatId.trim(), ok: false });
    }
  }

  return res.status(200).json({ success: true, results });
}
