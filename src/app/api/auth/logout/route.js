import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore);
  session.destroy();

  return NextResponse.json({ success: true });
}
