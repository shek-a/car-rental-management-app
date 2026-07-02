import { FleetStatus } from "@/generated/types";
import { RentalPeriod } from "./rentalPeriod";

// FleetStatus is a *derived* value — computed from a car's rental period and the current time, never
// stored. This keeps it always correct as time passes (a car silently becomes due-soon then overdue).

export const DUE_SOON_WINDOW_DAYS = 2;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const deriveFleetStatus = (
  rentalPeriod: RentalPeriod | null,
  now: Date
): FleetStatus => {
  if (!rentalPeriod) {
    return FleetStatus.Available;
  }

  const dueBack = rentalPeriod.dueBackDate.getTime();
  const current = now.getTime();

  if (dueBack < current) {
    return FleetStatus.Overdue;
  }

  const dueSoonThreshold = current + DUE_SOON_WINDOW_DAYS * MILLISECONDS_PER_DAY;
  if (dueBack <= dueSoonThreshold) {
    return FleetStatus.DueSoon;
  }

  return FleetStatus.Leased;
};
