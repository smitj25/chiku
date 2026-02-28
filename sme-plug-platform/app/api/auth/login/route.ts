import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "sme-plug-dev-secret-change-in-production"
);

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        if (!email.includes("@")) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Find user
        const user = await db.user.findUnique({
            where: { email },
            include: { tenant: true }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Create JWT
        const token = await new SignJWT({
            userId: user.id,
            tenantId: user.tenant.id,
            email: user.email,
            plan: user.tenant.plan,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(JWT_SECRET);

        // Set httpOnly session cookie
        const cookieStore = await cookies();
        cookieStore.set("sme_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                company: user.tenant.companyName,
                plan: user.tenant.plan,
            },
        });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json(
            { error: "Something went wrong during login" },
            { status: 500 }
        );
    }
}
