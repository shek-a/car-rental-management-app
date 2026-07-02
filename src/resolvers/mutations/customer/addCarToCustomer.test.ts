import { addCarToCustomer } from "./addCarToCustomer";
import * as carRentalService from "@/domain/rental/carRentalService";
import { createNewCustomer } from "@/testing/utilities";
import { AuthenticationError, AuthorizationError } from "@/auth/errors";

jest.mock("@/domain/rental/carRentalService");

const service = carRentalService as jest.Mocked<typeof carRentalService>;
const dueBackDate = "2026-07-10T09:00:00.000Z";

describe("addCarToCustomer resolver", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects an unauthenticated request", async () => {
    await expect(
      addCarToCustomer({}, { carId: "1", customerId: "1", dueBackDate }, { currentCustomer: null })
    ).rejects.toThrow(AuthenticationError);
    expect(service.rentCarToCustomer).not.toHaveBeenCalled();
  });

  it("rejects renting against another customer's account", async () => {
    await expect(
      addCarToCustomer(
        {},
        { carId: "1", customerId: "1", dueBackDate },
        { currentCustomer: createNewCustomer("2") }
      )
    ).rejects.toThrow(AuthorizationError);
    expect(service.rentCarToCustomer).not.toHaveBeenCalled();
  });

  it("delegates to the rental service for the customer's own account", async () => {
    service.rentCarToCustomer.mockResolvedValue(createNewCustomer("1"));

    const result = await addCarToCustomer(
      {},
      { carId: "1", customerId: "1", dueBackDate },
      { currentCustomer: createNewCustomer("1") }
    );

    const [carId, customerId, due] = service.rentCarToCustomer.mock.calls[0];
    expect(carId).toBe("1");
    expect(customerId).toBe("1");
    expect(due).toEqual(new Date(dueBackDate));
    expect(result.customerId).toBe("1");
  });
});
