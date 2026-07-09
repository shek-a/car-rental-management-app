import { createRentalPeriod, periodsOverlap, RentalPeriod } from "./rentalPeriod";

describe("rental period", () => {
  const leaseDate = new Date("2026-07-01T09:00:00.000Z");

  it("captures the lease date and a later due-back date", () => {
    const dueBackDate = new Date("2026-07-06T09:00:00.000Z");

    const period = createRentalPeriod(leaseDate, dueBackDate);

    expect(period.leaseDate).toEqual(leaseDate);
    expect(period.dueBackDate).toEqual(dueBackDate);
  });

  it("is equal by value to another period with the same dates", () => {
    const dueBackDate = new Date("2026-07-06T09:00:00.000Z");

    expect(createRentalPeriod(leaseDate, dueBackDate)).toEqual(
      createRentalPeriod(leaseDate, dueBackDate)
    );
  });

  it("rejects a due-back date that is not after the lease date", () => {
    const sameInstant = new Date(leaseDate);
    const earlier = new Date("2026-06-30T09:00:00.000Z");

    expect(() => createRentalPeriod(leaseDate, sameInstant)).toThrow();
    expect(() => createRentalPeriod(leaseDate, earlier)).toThrow();
  });

  it("rejects an invalid date", () => {
    expect(() => createRentalPeriod(leaseDate, new Date("not-a-date"))).toThrow();
  });
});

describe("overlapping rental periods", () => {
  const period = (lease: string, dueBack: string): RentalPeriod =>
    createRentalPeriod(new Date(lease), new Date(dueBack));

  const currentRental = period(
    "2026-07-01T00:00:00.000Z",
    "2026-07-20T00:00:00.000Z"
  );

  it("overlaps a period contained within it", () => {
    const contained = period("2026-07-15T00:00:00.000Z", "2026-07-18T00:00:00.000Z");

    expect(periodsOverlap(currentRental, contained)).toBe(true);
  });

  it("overlaps a period partially covering its end", () => {
    const partial = period("2026-07-18T00:00:00.000Z", "2026-07-25T00:00:00.000Z");

    expect(periodsOverlap(currentRental, partial)).toBe(true);
  });

  it("overlaps a period picking up on its due-back day (no same-day turnaround)", () => {
    const boundaryDayPickup = period(
      "2026-07-20T00:00:00.000Z",
      "2026-07-25T00:00:00.000Z"
    );

    expect(periodsOverlap(currentRental, boundaryDayPickup)).toBe(true);
  });

  it("overlaps on the boundary day even when the times of day differ", () => {
    // The rental is due back at midnight UTC; the pickup is later the same calendar day.
    const laterThatDay = period(
      "2026-07-20T15:00:00.000Z",
      "2026-07-25T00:00:00.000Z"
    );

    expect(periodsOverlap(currentRental, laterThatDay)).toBe(true);
  });

  it("does not overlap a period starting the day after it ends", () => {
    const dayAfter = period("2026-07-21T00:00:00.000Z", "2026-07-25T00:00:00.000Z");

    expect(periodsOverlap(currentRental, dayAfter)).toBe(false);
  });

  it("is symmetric in its arguments", () => {
    const disjoint = period("2026-07-21T00:00:00.000Z", "2026-07-25T00:00:00.000Z");
    const touching = period("2026-07-20T15:00:00.000Z", "2026-07-25T00:00:00.000Z");

    expect(periodsOverlap(disjoint, currentRental)).toBe(false);
    expect(periodsOverlap(touching, currentRental)).toBe(true);
  });
});
