import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, carpools, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekOf = searchParams.get("weekOf");

  if (!weekOf) {
    return NextResponse.json(
      { error: "weekOf parameter is required" },
      { status: 400 }
    );
  }

  const monday = new Date(weekOf + "T00:00:00Z");
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);

  const mondayStr = weekOf;
  const sundayStr = sunday.toISOString().split("T")[0];

  const myRides = await db
    .select({
      bookingId: bookings.id,
      carpoolId: carpools.id,
      driverId: carpools.driverId,
      driverName: users.fullName,
      driverAvatarUrl: users.avatarUrl,
      route: carpools.route,
      date: bookings.date,
      time: carpools.time,
      originName: carpools.originName,
      destinationName: carpools.destinationName,
      routeDistance: carpools.routeDistance,
      routeDuration: carpools.routeDuration,
      gasMoneyRequested: carpools.gasMoneyRequested,
      returnCarpoolId: carpools.returnCarpoolId,
      totalSeats: carpools.totalSeats,
    })
    .from(bookings)
    .innerJoin(carpools, eq(bookings.carpoolId, carpools.id))
    .innerJoin(users, eq(carpools.driverId, users.id))
    .where(
      and(
        eq(bookings.riderUserId, session.user.id),
        sql`${bookings.date} >= ${mondayStr}`,
        sql`${bookings.date} <= ${sundayStr}`
      )
    )
    .orderBy(bookings.date, carpools.time);

  // Group by date
  const week: Record<string, typeof myRides> = {};

  // Initialize all 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    week[d.toISOString().split("T")[0]] = [];
  }

  for (const ride of myRides) {
    const dateStr = ride.date;
    if (!week[dateStr]) week[dateStr] = [];
    week[dateStr].push(ride);
  }

  return NextResponse.json(week);
}
