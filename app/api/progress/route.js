import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, DB_NAME } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";

// GET /api/progress -> { checked: { [itemId]: true } }
// Returns an empty object for signed-out visitors; the client falls back to
// localStorage in that case (see hooks/useProgress.js).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ checked: {} });
  }

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const doc = await db
    .collection("progress")
    .findOne({ userId: session.user.id });

  return NextResponse.json({ checked: doc?.checked || {} });
}

// PUT /api/progress  { checked: { [itemId]: true|false } }
// Upserts the whole checked-items map for the signed-in user in one write.
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const checked =
    body && typeof body.checked === "object" && body.checked !== null
      ? body.checked
      : {};

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  await db.collection("progress").updateOne(
    { userId: session.user.id },
    {
      $set: {
        userId: session.user.id,
        checked,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
