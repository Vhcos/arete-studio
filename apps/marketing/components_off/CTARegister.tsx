"use client";

import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@arete-studio/ui";

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE_URL!;

export default function CTARegister() {
  return (
    <Card className="mt-10">
      <CardHeader>
        <CardTitle>Empieza gratis</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Usamos POST de formulario para evitar CORS */}
        <form action={`${APP_BASE}/api/leads`} method="POST" className="flex gap-3">
          <input type="hidden" name="source" value="marketing-home" />
          <Input
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
            className="max-w-md"
          />
          <Button type="submit">Continuar</Button>
        </form>
        <p className="mt-2 text-sm text-zinc-500">
          Te enviaremos un link de acceso a tu correo. Sin tarjetas, sin compromiso.
        </p>
      </CardContent>
    </Card>
  );
}
