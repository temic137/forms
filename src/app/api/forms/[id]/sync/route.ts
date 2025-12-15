import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const {
      title,
      fields,
      conversationalMode,
      styling,
      notifications,
      multiStepConfig,
      quizMode,
      limitOneResponse,
      saveAndEdit,
    } = body;

    // Check if form belongs to user or if user is a collaborator
    const form = await prisma.form.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const isOwner = form.userId === session.user.id;
    let isCollaborator = false;

    if (!isOwner) {
      const collaborator = await prisma.collaborator.findFirst({
        where: {
          formId: id,
          userId: session.user.id,
          role: "EDITOR",
        },
      });
      if (collaborator) isCollaborator = true;
    }

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update form
    const updatedForm = await prisma.form.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(fields !== undefined && { fieldsJson: fields }),
        ...(conversationalMode !== undefined && { conversationalMode }),
        ...(styling !== undefined && { styling }),
        ...(notifications !== undefined && { notifications }),
        ...(multiStepConfig !== undefined && {
          multiStepConfig: multiStepConfig || null,
        }),
        ...(quizMode !== undefined && { quizMode: quizMode || null }),
        ...(limitOneResponse !== undefined && { limitOneResponse }),
        ...(saveAndEdit !== undefined && { saveAndEdit }),
      },
    });

    // Trigger Pusher event
    if (pusherServer) {
      await pusherServer.trigger(`form-${id}`, "form-update", {
        ...body,
        updatedBy: session.user.id,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(updatedForm);
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to sync form" },
      { status: 500 }
    );
  }
}





