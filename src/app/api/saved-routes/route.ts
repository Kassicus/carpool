import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedRoutes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchDirections } from "@/lib/mapbox";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const routes = await db
    .select()
    .from(savedRoutes)
    .where(eq(savedRoutes.driverId, session.user.id))
    .orderBy(savedRoutes.name);

  return NextResponse.json(routes);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name, originLat, originLng, originName,
      destinationLat, destinationLng, destinationName,
      routeGeometry: preGeometry, routeDistance: preDist, routeDuration: preDur,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Route name is required" }, { status: 400 });
    }
    if (!originLat || !originLng || !originName || !destinationLat || !destinationLng || !destinationName) {
      return NextResponse.json({ error: "Origin and destination are required" }, { status: 400 });
    }

    let routeGeometry: string | null = preGeometry ?? null;
    let routeDistance: number | null = preDist ?? null;
    let routeDuration: number | null = preDur ?? null;

    if (!routeGeometry) {
      const directions = await fetchDirections(
        { lat: originLat, lng: originLng },
        { lat: destinationLat, lng: destinationLng }
      );
      if (directions) {
        routeGeometry = directions.geometry;
        routeDistance = directions.distance;
        routeDuration = directions.duration;
      }
    }

    const [route] = await db
      .insert(savedRoutes)
      .values({
        driverId: session.user.id,
        name: name.trim(),
        originLat,
        originLng,
        originName,
        destinationLat,
        destinationLng,
        destinationName,
        routeGeometry,
        routeDistance,
        routeDuration,
      })
      .returning();

    return NextResponse.json(route, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save route" }, { status: 500 });
  }
}
