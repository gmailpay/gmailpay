const K = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function invokeOpenRouter(prompt) {
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${K}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'GmailPay'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 512
      })
    });
    const d = await r.json();
    if (d.error) return 'Sorry, I could not process that right now.';
    return d?.choices?.[0]?.message?.content || 'Sorry, I could not process that.';
  } catch (e) {
    return 'Sorry, something went wrong. Please try again.';
  }
}
