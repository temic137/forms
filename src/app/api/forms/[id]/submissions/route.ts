import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: formId } = await context.params;

    // Verify form belongs to user
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { 
        userId: true,
        title: true,
        fieldsJson: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all submissions with files
    const submissions = await prisma.submission.findMany({
      where: { formId },
      include: {
        files: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ 
      form: {
        title: form.title,
        fields: form.fieldsJson,
      },
      submissions 
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
