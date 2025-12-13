import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resend, generateCollaboratorInviteEmailHtml } from "@/lib/resend";

// GET: List collaborators
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if user is owner or collaborator
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
        },
      });
      if (collaborator) isCollaborator = true;
    }

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const collaborators = await prisma.collaborator.findMany({
      where: { formId: id },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(collaborators);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch collaborators" },
      { status: 500 }
    );
  }
}

// POST: Invite collaborator
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
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Only owner can invite? Or editors too?
    // Plan said: "Ensure only the Owner or existing Editors can invite others"
    const form = await prisma.form.findUnique({
      where: { id },
      select: { userId: true, title: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const isOwner = form.userId === session.user.id;
    let isEditor = false;

    if (!isOwner) {
      const collaborator = await prisma.collaborator.findFirst({
        where: {
          formId: id,
          userId: session.user.id,
          role: "EDITOR",
        },
      });
      if (collaborator) isEditor = true;
    }

    if (!isOwner && !isEditor) {
      return NextResponse.json(
        { error: "Only owners and editors can invite collaborators" },
        { status: 403 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if already a collaborator
    const existingCollaborator = await prisma.collaborator.findFirst({
      where: {
        formId: id,
        email,
      },
    });

    if (existingCollaborator) {
      return NextResponse.json(
        { error: "User is already a collaborator" },
        { status: 400 }
      );
    }

    const newCollaborator = await prisma.collaborator.create({
      data: {
        formId: id,
        email,
        userId: user?.id || null,
        role: "EDITOR", // Default role
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    // Send invite email
    try {
      // If locally running, construct localhost link, otherwise use production origin
      // Ideally use NEXTAUTH_URL or window.location.origin equivalent
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const inviteLink = `${baseUrl}/f/${id}`; // Direct link to form (or builder if they have access)
      
      await resend.emails.send({
        from: "Form Builder <onboarding@resend.dev>",
        to: email,
        subject: `Invitation to collaborate on ${form.title}`,
        html: generateCollaboratorInviteEmailHtml(form.title, inviteLink, session.user.name),
      });
    } catch (emailErr) {
      console.error("Failed to send invite email", emailErr);
      // Continue, as the collaborator was created successfully
    }

    return NextResponse.json(newCollaborator);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to invite collaborator" },
      { status: 500 }
    );
  }
}

