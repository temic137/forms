import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { 
      title, 
      fields, 
      multiStepConfig, 
      styling, 
      translations, 
      notifications, 
      conversationalMode, 
      quizMode, 
      limitOneResponse, 
      saveAndEdit,
      // Scheduling & Access Control
      closesAt,
      opensAt,
      isClosed,
      closedMessage,
    } = body ?? {};
    if (!title || !Array.isArray(fields)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Validation: opensAt < closesAt
    if (opensAt && closesAt) {
      if (new Date(opensAt) >= new Date(closesAt)) {
        return NextResponse.json(
          { error: "Opening time must be before closing time" },
          { status: 400 }
        );
      }
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
        // Scheduling & Access Control
        closesAt: closesAt ? new Date(closesAt) : null,
        opensAt: opensAt ? new Date(opensAt) : null,
        isClosed: isClosed || false,
        closedMessage: closedMessage || null,
      },
      select: { id: true },
    });

    // Track form creation (no PII)
    trackEvent('form_created', {
      fieldCount: fields.length,
      hasQuizMode: !!quizMode,
      hasMultiStep: !!multiStepConfig,
      isConversational: !!conversationalMode,
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

