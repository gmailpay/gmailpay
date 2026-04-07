export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { email, profile_id } = req.body;
  if (!email || !profile_id) return res.status(400).json({ error: "email and profile_id required" });
  
  const awEndpoint = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
  const awProjectId = process.env.APPWRITE_PROJECT_ID;
  const awApiKey = process.env.APPWRITE_API_KEY;
  
  try {
    const longUrl = `https://gmailpay.vercel.app/Dashboard?ref=${encodeURIComponent(email)}`;
    
    // Generate TinyURL (free, no limits)
    const tinyRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    const shortUrl = await tinyRes.text();
    
    if (!shortUrl.startsWith("https://")) {
      return res.status(500).json({ error: "Failed to generate short URL" });
    }
    
    // Update Appwrite profile
    if (awProjectId && awApiKey) {
      await fetch(`${awEndpoint}/databases/gmailpay/collections/profiles/documents/${profile_id}`, {
        method: "PATCH",
        headers: {
          "X-Appwrite-Project": awProjectId,
          "X-Appwrite-Key": awApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: { referral_short_url: shortUrl.trim() } }),
      });
    }
    
    return res.status(200).json({ short_url: shortUrl.trim() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
