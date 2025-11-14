import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: formId } = await context.params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";

    // Check if form belongs to user
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: {
        id: true,
        title: true,
        userId: true,
        fieldsJson: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get submissions
    const submissions = await prisma.submission.findMany({
      where: { formId },
      include: {
        files: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const fields = form.fieldsJson as Array<{ id: string; label: string; type: string }>;

    if (format === "json") {
      // Export as JSON
      const data = {
        formTitle: form.title,
        formId: form.id,
        exportDate: new Date().toISOString(),
        totalSubmissions: submissions.length,
        submissions: submissions.map((s) => {
          const answers = s.answersJson as Record<string, unknown>;
          const formattedAnswers: Record<string, unknown> = {};
          
          fields.forEach((field) => {
            formattedAnswers[field.label] = answers[field.id] || "";
          });

          return {
            submissionId: s.id,
            submittedAt: s.createdAt,
            answers: formattedAnswers,
            files: s.files.map((f) => ({
              fieldId: f.fieldId,
              filename: f.originalName,
              url: f.path,
            })),
          };
        }),
      };

      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${form.title.replace(/[^a-z0-9]/gi, "_")}_submissions.json"`,
        },
      });
    } else {
      // Export as CSV
      const headers = ["Submission ID", "Submitted At", ...fields.map((f) => f.label), "Files"];
      
      const rows = submissions.map((s) => {
        const answers = s.answersJson as Record<string, unknown>;
        const row = [
          s.id,
          new Date(s.createdAt).toISOString(),
          ...fields.map((field) => {
            const value = answers[field.id];
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return JSON.stringify(value);
            return String(value).replace(/"/g, '""'); // Escape quotes
          }),
          s.files.map((f) => f.originalName).join("; "),
        ];
        return row.map((cell) => `"${cell}"`).join(",");
      });

      const csv = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${form.title.replace(/[^a-z0-9]/gi, "_")}_submissions.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Failed to export submissions:", error);
    return NextResponse.json(
      { error: "Failed to export submissions" },
      { status: 500 }
    );
  }
}
