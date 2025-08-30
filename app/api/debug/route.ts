export const runtime = 'edge';

export async function GET() {
  const key = process.env.OPENAI_API_KEY || '';
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
  return Response.json({
    hasKey: Boolean(key),
    keyTail: key ? key.slice(-6) : null, // máscara segura
    model
  });
}
