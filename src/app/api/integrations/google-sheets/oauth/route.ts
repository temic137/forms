import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

/**
 * GET - Initiate OAuth flow for Google Sheets
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");
    const state = searchParams.get("state"); // Contains formId and any other data

    if (!formId && !state) {
      return NextResponse.json({ error: "Form ID required" }, { status: 400 });
    }

    const actualFormId = formId || (state ? JSON.parse(decodeURIComponent(state)).formId : null);

    // Verify user owns the form
    const form = await prisma.form.findFirst({
      where: {
        id: actualFormId,
        user: { email: session.user.email }
      }
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Google OAuth not configured" },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || "http://localhost:3000"}/api/integrations/google-sheets/oauth/callback`
    );

    const scopes = [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file"
    ];

    const stateParam = encodeURIComponent(JSON.stringify({ formId: actualFormId }));
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent", // Force consent to get refresh token
      state: stateParam,
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth" },
      { status: 500 }
    );
  }
}

