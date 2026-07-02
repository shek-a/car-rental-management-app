import { deriveFleetStatus, DUE_SOON_WINDOW_DAYS } from "./fleetStatus";
import { createRentalPeriod } from "./rentalPeriod";
import { FleetStatus } from "@/generated/types";

const now = new Date("2026-07-01T12:00:00.000Z");
const daysFromNow = (days: number): Date =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
const leaseDate = new Date("2026-06-25T12:00:00.000Z");

describe("fleet status derivation", () => {
  it("uses a 2-day due-soon window", () => {
    expect(DUE_SOON_WINDOW_DAYS).toBe(2);
  });

  it("is AVAILABLE when the car has no rental period", () => {
    expect(deriveFleetStatus(null, now)).toBe(FleetStatus.Available);
  });

  it("is LEASED when the due-back date is more than 2 days away", () => {
    const period = createRentalPeriod(leaseDate, daysFromNow(5));
    expect(deriveFleetStatus(period, now)).toBe(FleetStatus.Leased);
  });

  it("is DUE_SOON when the due-back date is within the next 2 days", () => {
    const period = createRentalPeriod(leaseDate, daysFromNow(1));
    expect(deriveFleetStatus(period, now)).toBe(FleetStatus.DueSoon);
  });

  it("is OVERDUE when the due-back date is in the past", () => {
    const period = createRentalPeriod(leaseDate, daysFromNow(-1));
    expect(deriveFleetStatus(period, now)).toBe(FleetStatus.Overdue);
  });
});
