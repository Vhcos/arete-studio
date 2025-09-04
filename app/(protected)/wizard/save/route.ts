export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { step, data } = body || {};

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {},
    create: { email: session.user.email },
  });

  const project = await prisma.project.findFirst({ where: { userId: user.id } });
  if (!project) {
    await prisma.project.create({ data: { userId: user.id, data: { [step]: data } } });
  } else {
    await prisma.project.update({
      where: { id: project.id },
      data: { data: { ...(project.data as any), [step]: data } },
    });
  }

  return NextResponse.json({ ok: true });
}
