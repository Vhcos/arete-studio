"use client";

import * as React from "react";

export default function NewsletterForm() {
  const [email, setEmail] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: manda a tu backend / newsletter service
    alert(`¡Gracias! Te avisaremos a: ${email}`);
    setEmail("");
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2 max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className="flex-1 rounded-md border border-slate-300 px-3 py-2"
      />
      <button className="rounded-md px-4 py-2 bg-black text-white">Quiero probar</button>
    </form>
  );
}
