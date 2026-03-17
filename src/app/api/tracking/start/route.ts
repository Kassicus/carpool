import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carpools, rideInstances } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { carpoolId } = await request.json();
    if (!carpoolId) {
      return NextResponse.json({ error: "carpoolId required" }, { status: 400 });
    }

    // Verify ownership
    const [carpool] = await db
      .select()
      .from(carpools)
      .where(and(eq(carpools.id, carpoolId), eq(carpools.driverId, session.user.id)))
      .limit(1);

    if (!carpool) {
      return NextResponse.json({ error: "Carpool not found" }, { status: 404 });
    }

    await db
      .update(carpools)
      .set({ isActive: true })
      .where(eq(carpools.id, carpoolId));

    // Create or update ride instance for today
    const today = new Date().toISOString().split("T")[0];
    await db
      .insert(rideInstances)
      .values({ carpoolId, date: today, status: "in_progress" })
      .onConflictDoUpdate({
        target: [rideInstances.carpoolId, rideInstances.date],
        set: { status: "in_progress", startedAt: new Date() },
      });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to start tracking" }, { status: 500 });
  }
}
