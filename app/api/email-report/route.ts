// app/api/email-report/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { renderReportEmailHtml } from '@/lib/renderReportHtml';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Arete <login@aret3.cl>';
const EMAIL_BCC = (process.env.EMAIL_BCC || '').trim();
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;

    // Sesión (para userId / clientId)
    const session = await getServerSession(authOptions).catch(() => null);
    const sessionUser = (session as any)?.user ?? {};

    // 1) Destinatarios:
    const toRaw = String(body?.to || '').trim();
    const adminFallback = EMAIL_BCC || ADMIN_EMAILS[0] || '';
    const to = toRaw || adminFallback;

    if (!to) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'No hay destinatario (to) y tampoco EMAIL_BCC/ADMIN_EMAILS',
        },
        { status: 400 }
      );
    }

    // 2) HTML del informe (igual que antes)
    const html = renderReportEmailHtml({
      summary: body.summary,
      preAI: body.preAI,
      report: body?.report ?? null,
      aiPlan: body?.aiPlan ?? null,
      user: body?.user ?? {},
    });

    // 3) Subject estándar para Apps Script
    // Intentamos obtener el slug del cliente desde:
    // 1) body.clientSlug / body.user.clientSlug
    // 2) session.user.clientSlug (si existiera)
    // 3) Prisma.Client usando clientId (de sesión o body)
    let clientSlug: string =
      (body?.clientSlug as string | undefined) ||
      (body?.user?.clientSlug as string | undefined) ||
      (sessionUser?.clientSlug as string | undefined) ||
      'unknown';

    if (clientSlug === 'unknown') {
      // Intentamos resolver clientSlug desde la BD usando clientId
      const clientIdFromSession = sessionUser?.clientId as
        | string
        | undefined;
      const clientIdFromBody =
        (body?.clientId as string | undefined) ||
        (body?.user?.clientId as string | undefined);

      const clientIdForSlug = clientIdFromBody || clientIdFromSession;

      if (clientIdForSlug) {
        try {
          const client = await prisma.client.findUnique({
            where: { id: clientIdForSlug },
            select: { slug: true },
          });
          if (client?.slug) {
            clientSlug = client.slug;
          }
        } catch (e) {
          console.warn(
            '[email-report] No se pudo obtener client.slug desde Prisma:',
            e
          );
        }
      }
    }

    const userEmailForSubject: string =
      (body?.user?.email as string | undefined) || to;

    const emailSubject = `[ARET3-REPORT] ORG:${clientSlug} USER:${userEmailForSubject}`;


    // 4) PDF adjunto: esperamos pdfBase64 desde el front
    const pdfBase64 =
      (body?.pdfBase64 as string | undefined)?.trim() || '';
    const pdfFilename =
      (body?.pdfFilename as string | undefined) ||
      `Informe-aret3-${Date.now()}.pdf`;

    const attachments =
      pdfBase64.length > 0
        ? [
            {
              filename: pdfFilename,
              content: pdfBase64, // base64
              contentType: 'application/pdf',
            },
          ]
        : undefined;

    // 5) Modo preview (sin API key) => NO envía correo real
    if (!resend) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        to,
        preview: true,
        html,
        emailSubject,
        hasAttachment: Boolean(attachments),
      });
    }

    // 6) Envío real con Resend
    const send = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      ...(EMAIL_BCC ? { bcc: EMAIL_BCC } : {}),
      subject: emailSubject,
      html,
      ...(attachments ? { attachments } : {}),
    });

    if ((send as any)?.error) {
      return NextResponse.json(
        { ok: false, error: String((send as any).error) },
        { status: 500 }
      );
    }

    // 7) Registro en Prisma.Report (best-effort, no rompe la respuesta)
    try {
      // clientId: obligatorio en Report → si no hay, NO creamos el registro
      const clientIdFromSession = sessionUser?.clientId as
        | string
        | undefined;
      const clientIdFromBody =
        (body?.clientId as string | undefined) ||
        (body?.user?.clientId as string | undefined);

      const clientId = clientIdFromBody || clientIdFromSession;

      if (clientId) {
        const userId = sessionUser?.id as string | undefined;

        const projectNameRaw =
          (body?.user?.projectName as string | undefined) ||
          (body?.projectName as string | undefined);

        const summaryRaw = body?.summary as string | undefined;

        const kind: string =
          (body?.kind as string | undefined) ||
          (body?.reportKind as string | undefined) ||
          'evaluate';

        await prisma.report.create({
          data: {
            clientId, // string obligatorio
            ...(userId ? { userId } : {}),
            ...(projectNameRaw ? { projectName: projectNameRaw } : {}),
            kind,
            ...(summaryRaw ? { summary: summaryRaw } : {}),
            // driveFileId lo dejamos sin setear por ahora
          },
        });
      } else {
        console.warn(
          '[email-report] No se creó Report porque no hay clientId (ni en sesión ni en body)'
        );
      }
    } catch (e) {
      console.error(
        'Error creando Report en Prisma desde email-report:',
        e
      );
      // No lanzamos error al cliente; el mail igual se mandó
    }

    return NextResponse.json({
      ok: true,
      id: (send as any).id || null,
      to,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
