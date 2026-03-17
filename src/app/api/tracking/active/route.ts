import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, carpools, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeRides = await db
    .select({
      carpoolId: carpools.id,
      route: carpools.route,
      originName: carpools.originName,
      destinationName: carpools.destinationName,
      driverName: users.fullName,
      time: carpools.time,
    })
    .from(bookings)
    .innerJoin(carpools, eq(bookings.carpoolId, carpools.id))
    .innerJoin(users, eq(carpools.driverId, users.id))
    .where(
      and(
        eq(bookings.riderUserId, session.user.id),
        eq(carpools.isActive, true)
      )
    )
    .limit(1);

  if (activeRides.length === 0) {
    return NextResponse.json(null);
  }

  return NextResponse.json(activeRides[0]);
}
