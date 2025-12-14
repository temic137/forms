import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, collaboratorId } = await context.params;

    const form = await prisma.form.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const isOwner = form.userId === session.user.id;

    // Only owner can remove collaborators?
    // Or maybe editors can remove themselves?
    // Let's stick to Owner can remove anyone. Editors can remove themselves (leave).
    
    const collaboratorToRemove = await prisma.collaborator.findUnique({
      where: { id: collaboratorId },
    });

    if (!collaboratorToRemove) {
      return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
    }

    if (collaboratorToRemove.formId !== id) {
      return NextResponse.json({ error: "Collaborator mismatch" }, { status: 400 });
    }

    const isSelf = collaboratorToRemove.userId === session.user.id;

    if (!isOwner && !isSelf) {
      return NextResponse.json(
        { error: "Only owners can remove collaborators" },
        { status: 403 }
      );
    }

    await prisma.collaborator.delete({
      where: { id: collaboratorId },
    });

    return NextResponse.json({ message: "Collaborator removed" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to remove collaborator" },
      { status: 500 }
    );
  }
}


