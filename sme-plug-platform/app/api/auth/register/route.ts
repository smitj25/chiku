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
        const { email, password, companyName } = await req.json();

        if (!email || !password || !companyName) {
            return NextResponse.json(
                { error: "Email, password, and company name are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "A user with this email already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create Tenant and User simultaneously
        const tenant = await db.tenant.create({
            data: {
                companyName,
                users: {
                    create: {
                        email,
                        passwordHash,
                    },
                },
            },
            include: {
                users: true,
            },
        });

        const user = tenant.users[0];

        // Create JWT
        const token = await new SignJWT({
            userId: user.id,
            tenantId: tenant.id,
            email: user.email,
            plan: tenant.plan,
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

        return NextResponse.json(
            {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    company: tenant.companyName,
                    plan: tenant.plan,
                    createdAt: user.createdAt.toISOString(),
                },
            },
            { status: 201 }
        );
    } catch (e: any) {
        console.error(e);
        return NextResponse.json(
            { error: "Something went wrong during registration" },
            { status: 500 }
        );
    }
}
