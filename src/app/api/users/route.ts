// src/app/api/users/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // ✅ important: Prisma needs Node
export const dynamic = "force-dynamic"; // ✅ avoid build-time/static assumptions

export async function GET() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}
