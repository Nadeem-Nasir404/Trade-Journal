import { NextRequest, NextResponse } from "next/server";

import { ensureDefaultAccount } from "@/lib/accounts";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, signUpSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.parse(body);
    const email = normalizeEmail(parsed.email);

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.name,
        passwordHash,
        authProvider: "EMAIL",
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    await ensureDefaultAccount(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid sign up payload", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
