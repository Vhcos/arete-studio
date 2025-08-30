// app/api/email-report/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resendKey = process.env.RESEND_API_KEY || '';
const FROM = process.env.EMAIL_FROM || '';
const DEV_TO = process.env.NEXT_PUBLIC_DEV_TO || process.env.DEV_TO || '';

function esc(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .slice(0, 4000);
}

function todayStamp() {
  const d = new Date();
  return d.toLocaleString();
}

function buildHtml(payload: any) {
  const { user = {}, report = null, aiPlan = null } = payload || {};
  const { projectName, founderName, email, idea, rubro, ubicacion } = user;

  const userBlock = `
    <div style="font:14px system-ui,-apple-system,Segoe UI,Roboto">
      <h2 style="margin:0 0 8px">Informe Areté</h2>
      <div style="padding:12px;border:1px solid #eee;border-radius:10px">
        <div><b>Proyecto:</b> ${esc(projectName) || '-'}</div>
        <div><b>Emprendedor/a:</b> ${esc(founderName) || '-'}</div>
        <div><b>Email:</b> ${esc(email) || '-'}</div>
        ${idea ? `<div><b>Idea:</b> ${esc(idea)}</div>` : ''}
        ${rubro || ubicacion ? `<div><b>Contexto:</b> ${esc(rubro)} · ${esc(ubicacion)}</div>` : ''}
      </div>
    </div>`;

  const repBlock = report ? `
    <h3 style="margin:18px 0 8px">Informe</h3>
    <pre style="white-space:pre-wrap;font:13px ui-monospace,Menlo,Consolas,monospace;background:#fafafa;border:1px solid #eee;border-radius:10px;padding:12px">
${esc(report?.sections?.industryBrief || '')}

${esc(report?.sections?.competitionLocal || '')}

${esc(report?.sections?.swotAndMarket || '')}

${esc(report?.sections?.finalVerdict || '')}

Score: ${esc(report?.ranking?.score)} / 100
    </pre>` : '';

  const planBlock = aiPlan ? `
    <h3 style="margin:18px 0 8px">Plan (IA)</h3>
    ${aiPlan.plan100 ? `<p style="font:14px system-ui">${esc(aiPlan.plan100)}</p>` : ''}
    ${Array.isArray(aiPlan.acciones) ? `
      <div style="font:14px system-ui">
        <b>Acciones:</b>
        <ul>
          ${aiPlan.acciones.slice(0, 10).map((a: any) =>
            `<li>Día ${esc(a?.dia)} — ${esc(a?.tarea)} (${esc(a?.indicador)})</li>`).join('')}
        </ul>
      </div>` : ''}
  ` : '';

  return `
  <div style="max-width:720px;margin:0 auto">
    ${userBlock}
    ${repBlock}
    ${planBlock}
    <div style="margin-top:16px;color:#888;font:12px system-ui">Enviado: ${esc(todayStamp())}</div>
  </div>`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const toReq: string | undefined = (body?.to || '').toString().trim();
    const reason: string = (body?.reason || 'user-asked').toString();

    // variables de entorno mínimas
    if (!resendKey || !FROM) {
      return NextResponse.json({ ok: false, skipped: true, reason: 'env-missing' });
    }

    const resend = new Resend(resendKey);

    const subject = `Informe Areté · ${todayStamp()}`;
    const html = buildHtml(body);

    // destino deseado (si falla por 403 → cae a DEV_TO)
    const desiredTo = toReq || DEV_TO || FROM;

    try {
      const sent = await resend.emails.send({
        from: FROM,
        to: desiredTo,
        subject,
        html,
      });

      if (sent?.error) throw sent.error;
      return NextResponse.json({ ok: true, to: desiredTo });
    } catch (e: any) {
      // Modo test/sandbox de Resend (403) → reenviar al dev
      const code = e?.statusCode || e?.status || 0;
      if (code === 403 && DEV_TO && desiredTo !== DEV_TO) {
        await resend.emails.send({ from: FROM, to: DEV_TO, subject, html });
        return NextResponse.json({ ok: true, to: DEV_TO, testFallback: true });
      }
      console.error('[email-report] error:', e);
      return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
    }
  } catch (err) {
    console.error('[email-report] fatal:', err);
    return NextResponse.json({ ok: false, error: 'bad-request' }, { status: 400 });
  }
}



console.log('[email-report] ENV check', {
  hasKey: !!process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM,
  forcedTo: process.env.NEXT_PUBLIC_DEV_TO,
});
