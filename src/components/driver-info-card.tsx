import Avatar from "./ui/avatar";
import Badge from "./ui/badge";
import Card from "./ui/card";
import { formatDuration, formatDistance } from "@/lib/map-style";

interface DriverInfoCardProps {
  name: string;
  route: string;
  time: string;
  routeDistance?: number | null;
  routeDuration?: number | null;
}

export default function DriverInfoCard({ name, route, time, routeDistance, routeDuration }: DriverInfoCardProps) {
  const hasRouteInfo = routeDistance != null && routeDuration != null && routeDistance > 0;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Avatar name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-text">{name}</h3>
          <p className="text-sm text-text-secondary">{route}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{time}</Badge>
            {hasRouteInfo && (
              <Badge variant="secondary">~{formatDuration(routeDuration!)} &middot; {formatDistance(routeDistance!)}</Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
