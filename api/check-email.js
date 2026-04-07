import dns from "dns";
import net from "net";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { email, doc_id } = req.body;
  if (!email || !doc_id) return res.status(400).json({ error: "email and doc_id required" });
  
  try {
    const exists = await checkGmailExists(email);
    const isPrex = email.split("@")[0].toLowerCase().endsWith("prex");
    
    let newStatus, reason;
    if (!exists.ok) {
      newStatus = "rejected";
      reason = exists.reason;
    } else if (isPrex) {
      newStatus = "sub_approved";
      reason = "Auto-approved (prex + exists)";
    } else {
      newStatus = "pending";
      reason = "Exists but requires manual approval";
    }
    
    // Update Appwrite
    const awEndpoint = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
    const awProjectId = process.env.APPWRITE_PROJECT_ID;
    const awApiKey = process.env.APPWRITE_API_KEY;
    
    if (newStatus !== "pending" && awProjectId && awApiKey) {
      const updateData = newStatus === "rejected" 
        ? { status: newStatus, rejection_reason: reason }
        : { status: newStatus };
      
      await fetch(`${awEndpoint}/databases/gmailpay/collections/gmail_submissions/documents/${doc_id}`, {
        method: "PATCH",
        headers: {
          "X-Appwrite-Project": awProjectId,
          "X-Appwrite-Key": awApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: updateData }),
      });
    }
    
    return res.status(200).json({ status: newStatus, reason, exists: exists.ok });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function checkGmailExists(email) {
  return new Promise((resolve) => {
    const domain = email.split("@")[1];
    if (!domain || !["gmail.com", "googlemail.com"].includes(domain.toLowerCase())) {
      return resolve({ ok: false, reason: "Not a Gmail address" });
    }
    
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses?.length) return resolve({ ok: false, reason: "No MX records" });
      
      const host = addresses.sort((a, b) => a.priority - b.priority)[0].exchange;
      const socket = net.createConnection(25, host);
      let step = 0, response = "";
      
      socket.setTimeout(10000);
      socket.on("timeout", () => { socket.destroy(); resolve({ ok: false, reason: "Timeout" }); });
      socket.on("error", () => { socket.destroy(); resolve({ ok: false, reason: "Connection error" }); });
      
      socket.on("data", (data) => {
        response = data.toString();
        if (step === 0 && response.startsWith("220")) {
          socket.write("HELO verify.gmailpay.com\r\n"); step = 1;
        } else if (step === 1 && response.startsWith("250")) {
          socket.write("MAIL FROM:<verify@gmailpay.com>\r\n"); step = 2;
        } else if (step === 2 && response.startsWith("250")) {
          socket.write(`RCPT TO:<${email}>\r\n`); step = 3;
        } else if (step === 3) {
          const code = parseInt(response.substring(0, 3));
          socket.write("QUIT\r\n");
          socket.destroy();
          if (code === 250) resolve({ ok: true, reason: "Email exists" });
          else if (code === 550) resolve({ ok: false, reason: "Email does not exist" });
          else resolve({ ok: false, reason: `SMTP code ${code}` });
        }
      });
    });
  });
}
