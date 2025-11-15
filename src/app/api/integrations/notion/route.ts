import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { validateNotionConnection, NotionConfig } from "@/lib/notion";

/**
 * GET - Get Notion integration for a form
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
        type: "notion"
      }
    });

    return NextResponse.json({ integration });
  } catch (error) {
    console.error("Error fetching Notion integration:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update Notion integration
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { formId, apiKey, databaseId, enabled = true } = body;

    if (!formId || !apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
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

    // Get existing integration to preserve field mapping
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        formId,
        type: "notion"
      }
    });

    const config: NotionConfig = {
      apiKey: apiKey.trim(),
      databaseId: databaseId?.trim() || undefined, // Optional - will create if not provided
    };

    // Validate the connection and create database if needed
    const validation = await validateNotionConnection(config, form.title);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Failed to validate Notion connection" },
        { status: 400 }
      );
    }

    // Use created database ID if one was created
    if (validation.databaseId && !config.databaseId) {
      config.databaseId = validation.databaseId;
    }

    // Preserve field mapping if it exists
    const existingConfig = existingIntegration?.config as any || {};
    const finalConfig = {
      ...config,
      fieldMapping: existingConfig.fieldMapping || {},
    };

    let integration;
    if (existingIntegration) {
      // Update existing
      integration = await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: {
          config: finalConfig,
          enabled
        }
      });
    } else {
      // Create new
      integration = await prisma.integration.create({
        data: {
          formId,
          type: "notion",
          config: finalConfig,
          enabled
        }
      });
    }

    return NextResponse.json({
      success: true,
      integration,
      databaseTitle: validation.databaseTitle,
    });
  } catch (error) {
    console.error("Error setting up Notion integration:", error);
    return NextResponse.json(
      { error: "Failed to setup integration" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove Notion integration
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
        type: "notion"
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Notion integration:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}

