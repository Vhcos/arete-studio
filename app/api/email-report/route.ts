// app/api/email-report/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Resend } from 'resend';              // <- IMPORT CORRECTO (nombrado)

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const EMAIL_FROM     = process.env.EMAIL_FROM     ?? 'ARET3 <login@aret3.cl>';
const EMAIL_BCC      = process.env.EMAIL_BCC      ?? ''; // opcional

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      to?: string;
      silent?: boolean;
      reason?: string;
      report?: any;        // StandardReport
      aiPlan?: any;        // { plan100?: string; bullets?: string[] }
      user?: {
        projectName?: string;
        founderName?: string;
        email?: string;
        idea?: string;
        rubro?: string;
        ubicacion?: string;
      };
    };

    const to     = (body?.to ?? '').trim();
    const report = body?.report ?? {};
    const aiPlan = body?.aiPlan ?? {};
    const input  = report?.input ?? body?.user ?? {};

    if (!to) {
      return NextResponse.json({ ok:false, error:"Missing 'to' email" }, { status: 400 });
    }

    // ===== HTML (mismo contenido que la pantalla) =====
    const s = report?.sections ?? {};
    const li = (lines?: string|string[]) => {
      const arr = Array.isArray(lines) ? lines : (lines ? String(lines).split('\n') : []);
      return arr.filter(Boolean).map((x) => `<li>${x}</li>`).join('');
    };

    const html = `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h1 style="font-size:20px;margin:0 0 8px">Aret3 · Evalúa tu Idea de Negocio con IA</h1>
        <p style="margin:0 0 16px;color:#475569">Cumple tu propósito de la mejor manera</p>

        <h2 style="font-size:16px;margin:24px 0 8px">Informe</h2>

        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:8px 0 16px">
          <div><strong>Proyecto:</strong> ${input.proyecto ?? input.projectName ?? '—'}</div>
          <div><strong>Emprendedor/a:</strong> ${input.founderName ?? '—'}</div>
          <div><strong>Email:</strong> ${input.email ?? '—'}</div>
        </div>

        <h3 style="font-size:14px;margin:20px 0 8px">Resumen ejecutivo</h3>
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:8px 0 16px">
          <p style="margin:0">${s.industryBrief ?? ''}</p>
        </div>

        <h3 style="font-size:14px;margin:20px 0 8px">Rubro</h3>
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:8px 0 16px">
          <div><strong>Competencia local ($):</strong> ${s.competitionLocal ?? ''}</div>
          <div style="margin-top:8px"><strong>FODA + Tamaño de Mercado:</strong> ${s.swotAndMarket ?? ''}</div>
          <div style="margin-top:8px"><strong>Veredicto con 3 próximos pasos:</strong> ${s.finalVerdict ?? ''}</div>
        </div>

        ${s.marketMap ? `
          <h3 style="font-size:14px;margin:20px 0 8px">Mapa competitivo</h3>
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:8px 0 16px">
            <p style="margin:0">${s.marketMap}</p>
          </div>
        ` : ''}

        ${s.regulatoryChecklist ? `
          <h3 style="font-size:14px;margin:20px 0 8px">Checklist regulatorio</h3>
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:8px 0 16px">
            <ul style="margin:0 0 0 18px; padding:0">${li(s.regulatoryChecklist)}</ul>
          </div>
        ` : ''}

        ${(aiPlan?.plan100 || (aiPlan?.bullets ?? []).length) ? `
          <h3 style="font-size:14px;margin:20px 0 8px">Plan de acción (próximos 90 días)</h3>
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:8px 0 16px">
            ${aiPlan?.plan100 ? `<p style="margin:0 0 8px">${aiPlan.plan100}</p>` : ''}
            ${(aiPlan?.bullets ?? []).length ? `<ul style="margin:0 0 0 18px; padding:0">${li(aiPlan.bullets)}</ul>` : ''}
          </div>
        ` : ''}

        <p style="color:#64748b;margin-top:24px">Enviado por ARET3</p>
      </div>
    `;

    if (!RESEND_API_KEY) {
      // Modo prueba: no enviamos, devolvemos la “preview” para que tu botón muestre el pop-up actual
      return NextResponse.json({ ok:true, to, preview:true, html });
    }

    const resend = new Resend(RESEND_API_KEY);     // <- ya compila
    const sendRes = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      ...(EMAIL_BCC ? { bcc: EMAIL_BCC } : {}),
      subject: `Informe ARET3 — ${input.proyecto ?? input.projectName ?? 'Tu Proyecto'}`,
      html,
    });

    if ((sendRes as any)?.error) {
      return NextResponse.json({ ok:false, error:String((sendRes as any).error) }, { status:500 });
    }
    return NextResponse.json({ ok:true, id:(sendRes as any)?.id ?? null });

  } catch (err:any) {
    return NextResponse.json({ ok:false, error:String(err?.message || err) }, { status:500 });
  }
}
