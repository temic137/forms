import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Check if the current user is anonymous
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!currentUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (!currentUser.isAnonymous) {
            return NextResponse.json(
                { error: "Account is already a full account" },
                { status: 400 }
            );
        }

        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // Check if email is already taken by another user
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 400 }
            );
        }

        // Hash password and update user
        const hashedPassword = await bcrypt.hash(password, 10);

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: name || currentUser.name,
                email,
                password: hashedPassword,
                isAnonymous: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
                isAnonymous: true,
            },
        });

        return NextResponse.json({
            message: "Account upgraded successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json(
            { error: "Failed to upgrade account" },
            { status: 500 }
        );
    }
}
