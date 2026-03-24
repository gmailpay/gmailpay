const K = import.meta.env.VITE_GROQ_API_KEY;

export async function invokeGroq(prompt) {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${K}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
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
