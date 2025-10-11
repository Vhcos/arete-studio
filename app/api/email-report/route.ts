// app/api/email-report/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { renderReportEmailHtml } from '@/lib/renderReportHtml';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Arete <login@aret3.cl>';
const EMAIL_BCC = (process.env.EMAIL_BCC || '').trim();
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1) Destinatarios:
    // - si llega body.to lo usamos
    // - si no, usamos EMAIL_BCC o el primer ADMIN_EMAILS
    const toRaw = String(body?.to || '').trim();
    const adminFallback = EMAIL_BCC || ADMIN_EMAILS[0] || '';
    const to = toRaw || adminFallback;

    if (!to) {
      return NextResponse.json(
        { ok: false, error: 'No hay destinatario (to) y tampoco EMAIL_BCC/ADMIN_EMAILS' },
        { status: 400 }
      );
    }

    // 2) HTML
    const html = renderReportEmailHtml({
      summary: body.summary,
      preAI: body.preAI,
      report: body?.report ?? null,
      aiPlan: body?.aiPlan ?? null,
      user: body?.user ?? {},
    });

    // 3) Modo preview (sin API key) => NO falla y devuelve ok:true
    if (!resend) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        to,
        preview: true,
        html,
      });
    }

    // 4) Envío real
    const send = await resend.emails.send({
      from: EMAIL_FROM,
      to,                                 // un string o array sirve
      ...(EMAIL_BCC ? { bcc: EMAIL_BCC } : {}),
      subject: `Informe Preparado por el Equipo de Aret3 — ${body?.user?.projectName || 'Tu Proyecto'}`,
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
