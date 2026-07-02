import { removeCarFromCustomer } from "./removeCarFromCustomer";
import * as carRentalService from "@/domain/rental/carRentalService";
import { createNewCustomer } from "@/testing/utilities";
import { AuthenticationError, AuthorizationError } from "@/auth/errors";

jest.mock("@/domain/rental/carRentalService");

const service = carRentalService as jest.Mocked<typeof carRentalService>;

describe("removeCarFromCustomer resolver", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects an unauthenticated request", async () => {
    await expect(
      removeCarFromCustomer({}, { carId: "1", customerId: "1" }, { currentCustomer: null })
    ).rejects.toThrow(AuthenticationError);
    expect(service.returnCarFromCustomer).not.toHaveBeenCalled();
  });

  it("rejects returning against another customer's account", async () => {
    await expect(
      removeCarFromCustomer(
        {},
        { carId: "1", customerId: "1" },
        { currentCustomer: createNewCustomer("2") }
      )
    ).rejects.toThrow(AuthorizationError);
    expect(service.returnCarFromCustomer).not.toHaveBeenCalled();
  });

  it("delegates to the rental service for the customer's own account", async () => {
    service.returnCarFromCustomer.mockResolvedValue(createNewCustomer("1"));

    const result = await removeCarFromCustomer(
      {},
      { carId: "1", customerId: "1" },
      { currentCustomer: createNewCustomer("1") }
    );

    expect(service.returnCarFromCustomer).toHaveBeenCalledWith("1", "1");
    expect(result.customerId).toBe("1");
  });
});
