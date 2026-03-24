import { useState, useRef, useEffect } from "react";
import { invokeGroq } from "@/lib/groq";
import { X, Send, Loader2, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GPayBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "bot", content: "Welcome to GPay! How can I help?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const m = input.trim();
    setInput("");
    setMsgs(p => [...p, { role: "user", content: m }]);
    setLoading(true);
    const r = await invokeGroq(
      `You are GPay bot for GmailPay. Users earn 200 Naira per approved Gmail. Password: iffyboi77. Min withdrawal: 1000. Bonus: 500 at 50 mails. Question: ${m}`
    );
    setMsgs(p => [...p, { role: "bot", content: r }]);
    setLoading(false);
  };

  return (
    <>
      {!open && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <Bot className="w-6 h-6" />
        </motion.button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-3rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: "420px" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold">
                  GPay <span className="text-primary text-xs font-normal">BOT</span>
                </p>
              </div>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary/20" : "bg-secondary"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-xl px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Type a message..."
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={send} disabled={loading} className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
