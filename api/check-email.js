export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { email, doc_id } = req.body;
  if (!email || !doc_id) return res.status(400).json({ error: "email and doc_id required" });
  
  const isPrex = email.split("@")[0].toLowerCase().endsWith("prex");
  const domain = email.split("@")[1]?.toLowerCase();
  
  // Basic validation - reject obviously bad emails without SMTP
  if (!domain || !["gmail.com", "googlemail.com"].includes(domain)) {
    await updateStatus(doc_id, "rejected", "Not a Gmail address");
    return res.status(200).json({ status: "rejected", reason: "Not a Gmail address", exists: false });
  }
  
  // If it's a prex email, auto-approve immediately (prex emails are pre-created)
  if (isPrex) {
    await updateStatus(doc_id, "sub_approved", null);
    return res.status(200).json({ status: "sub_approved", reason: "Auto-approved (prex)", exists: true });
  }
  
  // For non-prex emails, leave as pending for the 5-min bot to verify via SMTP
  return res.status(200).json({ status: "pending", reason: "Will be verified shortly", exists: null });
}

async function updateStatus(doc_id, status, reason) {
  const awEndpoint = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
  const awProjectId = process.env.APPWRITE_PROJECT_ID;
  const awApiKey = process.env.APPWRITE_API_KEY;
  
  if (!awProjectId || !awApiKey) return;
  
  const data = reason ? { status, rejection_reason: reason } : { status };
  
  try {
    await fetch(`${awEndpoint}/databases/gmailpay/collections/gmail_submissions/documents/${doc_id}`, {
      method: "PATCH",
      headers: {
        "X-Appwrite-Project": awProjectId,
        "X-Appwrite-Key": awApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
  } catch {}
}
