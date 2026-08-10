import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, DB_NAME } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";

const VALID_THEMES = ["dark", "light", "system"];

// GET /api/settings -> { theme: "dark" | "light" | "system" | null }
// null means the signed-in user has no saved preference yet.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ theme: null });
  }

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const doc = await db
    .collection("settings")
    .findOne({ userId: session.user.id });

  return NextResponse.json({ theme: doc?.theme || null });
}

// PUT /api/settings  { theme: "dark" | "light" | "system" }
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const theme = VALID_THEMES.includes(body?.theme) ? body.theme : "system";

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  await db.collection("settings").updateOne(
    { userId: session.user.id },
    {
      $set: {
        userId: session.user.id,
        theme,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
