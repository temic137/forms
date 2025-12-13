import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const form = await prisma.form.findUnique({
      where: { id },
      select: { 
        id: true, 
        title: true, 
        fieldsJson: true, 
        conversationalMode: true,
        styling: true,
        notifications: true,
        multiStepConfig: true,
        quizMode: true,
        limitOneResponse: true,
        saveAndEdit: true,
      },
    });
    if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(form);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { title, fields, conversationalMode, styling, notifications, multiStepConfig, limitOneResponse, saveAndEdit } = body;

    // Check if form belongs to user
    const form = await prisma.form.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.userId !== session.user.id) {
      const collaborator = await prisma.collaborator.findFirst({
        where: {
          formId: id,
          userId: session.user.id,
          role: "EDITOR",
        },
      });

      if (!collaborator) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Update form
    const updated = await prisma.form.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(fields !== undefined && { fieldsJson: fields }),
        ...(conversationalMode !== undefined && { conversationalMode }),
        ...(styling !== undefined && { styling }),
        ...(notifications !== undefined && { notifications }),
        ...(multiStepConfig !== undefined && { multiStepConfig: multiStepConfig || null }),
        ...(limitOneResponse !== undefined && { limitOneResponse }),
        ...(saveAndEdit !== undefined && { saveAndEdit }),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update form" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { title, fields, conversationalMode, styling, notifications, multiStepConfig, quizMode, limitOneResponse, saveAndEdit } = body;

    // Check if form belongs to user
    const form = await prisma.form.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.userId !== session.user.id) {
      const collaborator = await prisma.collaborator.findFirst({
        where: {
          formId: id,
          userId: session.user.id,
          role: "EDITOR",
        },
      });

      if (!collaborator) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Update form
    const updated = await prisma.form.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(fields !== undefined && { fieldsJson: fields }),
        ...(conversationalMode !== undefined && { conversationalMode }),
        ...(styling !== undefined && { styling }),
        ...(notifications !== undefined && { notifications }),
        ...(multiStepConfig !== undefined && { multiStepConfig: multiStepConfig || null }),
        ...(quizMode !== undefined && { quizMode: quizMode || null }),
        ...(limitOneResponse !== undefined && { limitOneResponse }),
        ...(saveAndEdit !== undefined && { saveAndEdit }),
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update form" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    
    // Check if form belongs to user
    const form = await prisma.form.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete form (cascade will delete submissions and files)
    await prisma.form.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Form deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete form" }, { status: 500 });
  }
}

