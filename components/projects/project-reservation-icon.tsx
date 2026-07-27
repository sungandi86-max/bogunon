import {
  Activity,
  BusFront,
  CalendarCheck,
  CarFront,
  Hotel,
  Plane,
  Ticket,
  Utensils,
} from "lucide-react";

import type { ProjectReservationType } from "@/types/database";

export function ProjectReservationIcon({
  size = 18,
  type,
}: {
  readonly size?: number;
  readonly type: ProjectReservationType;
}) {
  const props = { "aria-hidden": true as const, size };
  switch (type) {
    case "flight": return <Plane {...props} />;
    case "hotel": return <Hotel {...props} />;
    case "rental_car": return <CarFront {...props} />;
    case "restaurant": return <Utensils {...props} />;
    case "badminton": return <Activity {...props} />;
    case "transportation": return <BusFront {...props} />;
    case "ticket": return <Ticket {...props} />;
    case "custom": return <CalendarCheck {...props} />;
  }
}
