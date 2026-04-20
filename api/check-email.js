export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { email, doc_id } = req.body;
  if (!email || !doc_id) return res.status(400).json({ error: "email and doc_id required" });
  
  const domain = email.split("@")[1]?.toLowerCase();
  const username = email.split("@")[0]?.toLowerCase();
  
  // Reject non-Gmail addresses immediately
  if (!domain || !["gmail.com", "googlemail.com"].includes(domain)) {
    const awEndpoint = process.env.APPWRITE_ENDPOINT || "https://nyc.cloud.appwrite.io/v1";
    const awProjectId = process.env.APPWRITE_PROJECT_ID || "69e62b1e002805ef3412";
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
  
  // Check if username ends with "prex" - these are trusted submissions
  const endsWithPrex = username.endsWith("prex");
  
  // All Gmail emails stay pending - the CodeWords bot handles verification
  // Emails ending with "prex" will be auto-approved by the bot if they exist
  // Other emails stay pending for manual review
  return res.status(200).json({ 
    status: "pending", 
    trusted: endsWithPrex,
    reason: endsWithPrex 
      ? "Trusted submission - will be auto-verified shortly" 
      : "Will be reviewed by admin"
  });
}
