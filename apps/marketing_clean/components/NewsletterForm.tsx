// apps/marketing_clean/components/NewsletterForm.tsx
import { FormEvent, useState } from "react";

const input: React.CSSProperties = {
  flex: 1, padding: "12px 14px", borderRadius: 12, border: "1px solid #ccc",
};
const btn: React.CSSProperties = { padding: "12px 18px", borderRadius: 12, border: "1px solid #111" };

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"ok"|"error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "marketing_clean", utm_source: "landing" }),
      });
      if (res.ok) { setStatus("ok"); setEmail(""); } else { setStatus("error"); }
    } catch { setStatus("error"); }
  }

  return (
    <>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="email" required placeholder="tu@email.com"
          value={email} onChange={(e) => setEmail(e.target.value)} style={input}
        />
        <button disabled={status === "loading"} style={btn}>
          {status === "loading" ? "Enviando…" : "Quiero probar"}
        </button>
      </form>
      {status === "ok" && <p style={{ color: "green" }}>¡Listo! Te avisaremos.</p>}
      {status === "error" && <p style={{ color: "crimson" }}>Ups, intenta de nuevo.</p>}
    </>
  );
}
