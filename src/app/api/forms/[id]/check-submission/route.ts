import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await context.params;
    const { searchParams } = new URL(req.url);
    const respondentId = searchParams.get("respondentId");

    if (!respondentId) {
      return NextResponse.json(
        { error: "Respondent ID is required" },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.findFirst({
      where: {
        formId,
        respondentId,
      },
      select: { id: true },
    });

    return NextResponse.json({
      submitted: !!submission,
    });
  } catch (error) {
    console.error("Check submission error:", error);
    return NextResponse.json(
      { error: "Failed to check submission status" },
      { status: 500 }
    );
  }
}



