// app/api/debug/route.ts

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET() {
  const key = process.env.OPENAI_API_KEY || "";
  const tail = key ? key.slice(-6) : "";
  return json({
    hasKey: !!key,
    keyTail: tail,
    model: process.env.OPENAI_MODEL || "gpt-4.1",
  });
}
