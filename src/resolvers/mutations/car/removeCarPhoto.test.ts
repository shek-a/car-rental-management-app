import { removeCarPhoto } from "./removeCarPhoto";
import * as carPhotoService from "@/domain/car/carPhotoService";
import { createNewCar, createNewCustomer, createAdministrator } from "@/testing/utilities";
import { AuthenticationError, AuthorizationError } from "@/auth/errors";

jest.mock("@/domain/car/carPhotoService");

const service = carPhotoService as jest.Mocked<typeof carPhotoService>;

describe("removeCarPhoto resolver", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects an unauthenticated request", async () => {
    await expect(
      removeCarPhoto({}, { carId: "1" }, { currentCustomer: null })
    ).rejects.toThrow(AuthenticationError);
    expect(service.removeCarPhoto).not.toHaveBeenCalled();
  });

  it("rejects a non-administrator", async () => {
    await expect(
      removeCarPhoto({}, { carId: "1" }, { currentCustomer: createNewCustomer("9") })
    ).rejects.toThrow(AuthorizationError);
    expect(service.removeCarPhoto).not.toHaveBeenCalled();
  });

  it("delegates to the service for an administrator", async () => {
    service.removeCarPhoto.mockResolvedValue(createNewCar("1"));

    const result = await removeCarPhoto(
      {},
      { carId: "1" },
      { currentCustomer: createAdministrator("admin") }
    );

    expect(service.removeCarPhoto).toHaveBeenCalledWith("1");
    expect(result.carId).toBe("1");
  });
});
