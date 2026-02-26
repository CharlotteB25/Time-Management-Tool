"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function secondsBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}

export async function startSession(categoryId: string, description?: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // 🔎 Load category to validate
    const category = await tx.taskCategory.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });

    if (!category) {
      throw new Error("Categorie niet gevonden.");
    }

    // ✅ Enforce required description for "Overige taken"
    const isOverigeTaken =
      category.name.trim().toLowerCase() === "overige taken";

    if (isOverigeTaken && !description?.trim()) {
      throw new Error("Omschrijving is verplicht bij ‘Overige taken’.");
    }

    // End any currently running session
    const open = await tx.timeSession.findFirst({
      where: { userId, endedAt: null },
      orderBy: { startedAt: "desc" },
    });

    if (open) {
      await tx.timeSession.update({
        where: { id: open.id },
        data: {
          endedAt: now,
          durationSec: secondsBetween(open.startedAt, now),
        },
      });
    }

    // Start new session
    await tx.timeSession.create({
      data: {
        userId,
        categoryId,
        description: description?.trim() ? description.trim() : null,
        startedAt: now,
      },
    });
  });

  revalidatePath("/tracker");
}

export async function stopSession() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const now = new Date();

  const open = await prisma.timeSession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });

  if (!open) return;

  await prisma.timeSession.update({
    where: { id: open.id },
    data: {
      endedAt: now,
      durationSec: secondsBetween(open.startedAt, now),
    },
  });

  revalidatePath("/tracker");
}
