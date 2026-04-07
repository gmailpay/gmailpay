export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { email, doc_id } = req.body;
  if (!email || !doc_id) return res.status(400).json({ error: "email and doc_id required" });
  
  const domain = email.split("@")[1]?.toLowerCase();
  
  // Only reject obviously invalid emails (not Gmail)
  if (!domain || !["gmail.com", "googlemail.com"].includes(domain)) {
    const awEndpoint = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
    const awProjectId = process.env.APPWRITE_PROJECT_ID;
    const awApiKey = process.env.APPWRITE_API_KEY;
    if (awProjectId && awApiKey) {
      try {
        await fetch(`${awEndpoint}/databases/gmailpay/collections/gmail_submissions/documents/${doc_id}`, {
          method: "PATCH",
          headers: { "X-Appwrite-Project": awProjectId, "X-Appwrite-Key": awApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ data: { status: "rejected", rejection_reason: "Not a Gmail address" } }),
        });
      } catch {}
    }
    return res.status(200).json({ status: "rejected", reason: "Not a Gmail address" });
  }
  
  // ALL Gmail emails stay pending - the CodeWords bot (every 5 min) does the real SMTP check
  return res.status(200).json({ status: "pending", reason: "Will be verified by the bot shortly" });
}
