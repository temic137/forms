import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { title, fields, multiStepConfig, styling, translations, notifications, conversationalMode, quizMode, limitOneResponse, saveAndEdit } = body ?? {};
    if (!title || !Array.isArray(fields)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const created = await prisma.form.create({
      data: {
        title,
        fieldsJson: fields,
        multiStepConfig: multiStepConfig || null,
        styling: styling || null,
        translations: translations || null,
        notifications: notifications || null,
        conversationalMode: conversationalMode || false,
        quizMode: quizMode || null,
        limitOneResponse: limitOneResponse || false,
        saveAndEdit: saveAndEdit || false,
        userId: session?.user?.id || null,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create form";
    console.error("Error creating form:", err);
    return NextResponse.json(
      { error: message, details: String(err) },
      { status: 500 }
    );
  }
}

