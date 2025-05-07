import { NextResponse } from "next/server";
import csrf from "csrf";

const tokens = new csrf();
const secret = process.env.CSRF_SECRET || tokens.secretSync();

export async function GET() {
    const token = tokens.create(secret);

    // Set CSRF token as an HTTP-only cookie
    const response = NextResponse.json({ csrfToken: token });
    response.cookies.set("XSRF-TOKEN", token, { httpOnly: true });

    return response;
}