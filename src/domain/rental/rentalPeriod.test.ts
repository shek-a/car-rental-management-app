import { createRentalPeriod } from "./rentalPeriod";

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
