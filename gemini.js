const K=import.meta.env.VITE_GEMINI_API_KEY;
export async function invokeGemini(prompt){
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${K}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.7,maxOutputTokens:512}})});
  const d=await r.json();return d?.candidates?.[0]?.content?.parts?.[0]?.text||'Sorry, I could not process that.';}