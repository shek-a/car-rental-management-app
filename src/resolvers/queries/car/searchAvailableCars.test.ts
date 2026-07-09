import { searchAvailableCars } from "./searchAvailableCars";
import * as carAvailabilityService from "@/domain/rental/carAvailabilityService";
import { createNewCar } from "@/testing/utilities";

jest.mock("@/domain/rental/carAvailabilityService");

const availability = carAvailabilityService as jest.Mocked<
  typeof carAvailabilityService
>;

// The Date scalar has no scalar resolver, so period values arrive as raw strings.
const requestedPeriod = {
  leaseDate: "2026-07-15T00:00:00.000Z",
  dueBackDate: "2026-07-18T00:00:00.000Z",
};

describe("searchAvailableCars resolver", () => {
  beforeEach(() => jest.resetAllMocks());

  it("delegates the normalized location and requested period to the availability service", async () => {
    availability.searchAvailableCars.mockResolvedValue([]);

    await searchAvailableCars({}, { location: " melbourne ", requestedPeriod });

    const [location, period, now] = availability.searchAvailableCars.mock.calls[0];
    expect(location.value).toBe("melbourne");
    expect(period.leaseDate).toEqual(new Date(requestedPeriod.leaseDate));
    expect(period.dueBackDate).toEqual(new Date(requestedPeriod.dueBackDate));
    expect(now).toBeInstanceOf(Date);
  });

  it("returns the service's cars unchanged", async () => {
    const carsFound = [createNewCar("1", undefined, "Melbourne")];
    availability.searchAvailableCars.mockResolvedValue(carsFound);

    const results = await searchAvailableCars(
      {},
      { location: "Melbourne", requestedPeriod }
    );

    expect(results).toEqual(carsFound);
  });

  it("returns an empty list, not an error, when nothing matches", async () => {
    availability.searchAvailableCars.mockResolvedValue([]);

    await expect(
      searchAvailableCars({}, { location: "Perth", requestedPeriod })
    ).resolves.toEqual([]);
  });
});

describe("invalid searches are rejected before any search runs", () => {
  beforeEach(() => jest.resetAllMocks());

  it("rejects a due-back date on or before the lease date", async () => {
    const backwardsPeriod = {
      leaseDate: "2026-07-18T00:00:00.000Z",
      dueBackDate: "2026-07-15T00:00:00.000Z",
    };

    await expect(
      searchAvailableCars({}, { location: "Melbourne", requestedPeriod: backwardsPeriod })
    ).rejects.toThrow("A rental period's due-back date must be after its lease date");
    expect(availability.searchAvailableCars).not.toHaveBeenCalled();
  });

  it("rejects unreadable dates via the rental period invariant", async () => {
    const unreadablePeriod = {
      leaseDate: "not-a-date",
      dueBackDate: "2026-07-18T00:00:00.000Z",
    };

    await expect(
      searchAvailableCars({}, { location: "Melbourne", requestedPeriod: unreadablePeriod })
    ).rejects.toThrow("A rental period requires valid lease and due-back dates");
    expect(availability.searchAvailableCars).not.toHaveBeenCalled();
  });

  it("rejects a blank location", async () => {
    await expect(
      searchAvailableCars({}, { location: "   ", requestedPeriod })
    ).rejects.toThrow("A location must not be blank");
    expect(availability.searchAvailableCars).not.toHaveBeenCalled();
  });
});
