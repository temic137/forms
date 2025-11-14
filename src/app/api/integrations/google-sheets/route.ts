import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { addRowToSheet, formatSubmissionForSheet } from "@/lib/google-sheets";

/**
 * GET - Get Google Sheets integration for a form
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return NextResponse.json({ error: "Form ID required" }, { status: 400 });
    }

    // Verify user owns the form
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        user: { email: session.user.email }
      }
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Get integration
    const integration = await prisma.integration.findFirst({
      where: {
        formId,
        type: "google_sheets"
      }
    });

    return NextResponse.json({ integration });
  } catch (error) {
    console.error("Error fetching Google Sheets integration:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update Google Sheets integration
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { formId, spreadsheetId, sheetName, enabled = true } = body;

    if (!formId || !spreadsheetId || !sheetName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user owns the form
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        user: { email: session.user.email }
      }
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Check if integration already exists
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        formId,
        type: "google_sheets"
      }
    });

    const config = {
      spreadsheetId,
      sheetName
    };

    let integration;
    if (existingIntegration) {
      // Update existing
      integration = await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: {
          config,
          enabled
        }
      });
    } else {
      // Create new
      integration = await prisma.integration.create({
        data: {
          formId,
          type: "google_sheets",
          config,
          enabled
        }
      });
    }

    return NextResponse.json({
      success: true,
      integration
    });
  } catch (error) {
    console.error("Error setting up Google Sheets integration:", error);
    return NextResponse.json(
      { error: "Failed to setup integration" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove Google Sheets integration
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return NextResponse.json({ error: "Form ID required" }, { status: 400 });
    }

    // Verify user owns the form
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        user: { email: session.user.email }
      }
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Delete integration
    await prisma.integration.deleteMany({
      where: {
        formId,
        type: "google_sheets"
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Google Sheets integration:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}

