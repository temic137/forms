import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

/**
 * GET - OAuth callback handler
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/signin?error=unauthorized`
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?error=oauth_cancelled`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?error=oauth_failed`
      );
    }

    const stateData = JSON.parse(decodeURIComponent(state));
    const formId = stateData.formId;

    if (!formId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?error=invalid_request`
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
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?error=form_not_found`
      );
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?error=oauth_not_configured`
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || "http://localhost:3000"}/api/integrations/google-sheets/oauth/callback`
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?error=token_exchange_failed`
      );
    }

    // Store tokens in integration config
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        formId,
        type: "google_sheets"
      }
    });

    const tokenData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    };

    if (existingIntegration) {
      // Update existing integration with tokens
      const currentConfig = existingIntegration.config as any;
      await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: {
          config: {
            ...currentConfig,
            ...tokenData,
          }
        }
      });
    } else {
      // Create new integration with tokens (but no spreadsheet yet)
      await prisma.integration.create({
        data: {
          formId,
          type: "google_sheets",
          config: {
            spreadsheetId: null,
            sheetName: "Form Responses",
            ...tokenData,
          },
          enabled: false, // Not enabled until spreadsheet is configured
        }
      });
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?formId=${formId}&oauth_success=true`
    );
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?error=oauth_error`
    );
  }
}

