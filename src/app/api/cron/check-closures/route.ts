import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

export const dynamic = "force-dynamic"; // Ensure this endpoint is not cached

export async function GET(req: NextRequest) {
    try {
        // Basic security check (e.g., verify a secret from headers)
        const authHeader = req.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();

        // 1. Find forms that have passed their closing time and haven't sent a notification yet
        const formsToClose = await prisma.form.findMany({
            where: {
                closesAt: {
                    lt: now,
                    not: null,
                },
                closedNotificationSent: false,
                // We also check if user exists and has email
                user: {
                    email: { not: null },
                },
            },
            include: {
                user: true,
            },
            take: 50, // Process in batches to avoid timeouts
        });

        if (formsToClose.length === 0) {
            return NextResponse.json({ message: "No forms to process", count: 0 });
        }

        const results = await Promise.allSettled(
            formsToClose.map(async (form) => {
                try {
                    // Send email notification
                    if (form.user && form.user.email) {
                        await resend.emails.send({
                            from: process.env.RESEND_FROM_EMAIL || "Form Builder <onboarding@resend.dev>",
                            to: form.user.email,
                            subject: `Form Closed: ${form.title}`,
                            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Your form has closed</h2>
                  <p>Hello,</p>
                  <p>Your form <strong>"${form.title}"</strong> has reached its scheduled closing time and is no longer accepting new responses.</p>
                  <p><strong>Closed at:</strong> ${new Date(form.closesAt!).toLocaleString()}</p>
                  <p>You can reopen this form or change the schedule from your dashboard.</p>
                  <div style="margin-top: 20px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
                  </div>
                </div>
              `,
                        });
                    }

                    // Mark as sent
                    await prisma.form.update({
                        where: { id: form.id },
                        data: { closedNotificationSent: true },
                    });

                    return { id: form.id, status: "success" };
                } catch (error) {
                    console.error(`Failed to process form ${form.id}:`, error);
                    throw error;
                }
            })
        );

        const successCount = results.filter((r) => r.status === "fulfilled").length;
        const failCount = results.filter((r) => r.status === "rejected").length;

        return NextResponse.json({
            message: "Processed forms",
            success: successCount,
            failed: failCount,
            total: formsToClose.length,
        });
    } catch (error: any) {
        console.error("Cron job error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
