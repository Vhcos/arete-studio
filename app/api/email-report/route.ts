// app/api/email-report/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
// ⚠️ Si tu alias "@/..." NO está configurado en tsconfig, cambia la import a:
// import { renderReportEmailHtml } from '../../../lib/renderReportHtml';
import { renderReportEmailHtml } from '@/lib/renderReportHtml';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Arete <login@aret3.cl>';
const EMAIL_BCC = process.env.EMAIL_BCC || '';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const to = String(body?.to || '').trim();
    if (!to) {
      return NextResponse.json(
        { ok: false, error: 'Missing "to" email' },
        { status: 400 }
      );
    }

    // Construimos el HTML usando lo mismo que renderiza la pantalla
    const html = renderReportEmailHtml({
      report: body?.report ?? null,
      aiPlan: body?.aiPlan ?? null,
      user: body?.user ?? {},
    });

    // Si no hay API key => modo preview (útil en localhost/Vercel Preview)
    if (!resend) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        to,
        preview: true,
        html, // lo devolvemos para inspección en DevTools si quieres
      });
    }

    const send = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      ...(EMAIL_BCC ? { bcc: EMAIL_BCC } : {}),
      subject: `Informe ARET3 — ${body?.user?.projectName || 'Tu Proyecto'}`,
      html,
    });

    if ((send as any)?.error) {
      return NextResponse.json(
        { ok: false, error: String((send as any).error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: (send as any).id || null, to });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
