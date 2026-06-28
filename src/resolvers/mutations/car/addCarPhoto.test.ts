import { addCarPhoto } from "./addCarPhoto";
import * as carPhotoService from "@/domain/car/carPhotoService";
import { createNewCar, createNewCustomer, createAdministrator } from "@/testing/utilities";
import { AuthenticationError, AuthorizationError } from "@/auth/errors";

jest.mock("@/domain/car/carPhotoService");

const service = carPhotoService as jest.Mocked<typeof carPhotoService>;

const input = { data: "ZmFrZQ==", contentType: "image/jpeg" };

describe("addCarPhoto resolver", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects an unauthenticated request", async () => {
    await expect(
      addCarPhoto({}, { carId: "1", input }, { currentCustomer: null })
    ).rejects.toThrow(AuthenticationError);
    expect(service.addCarPhoto).not.toHaveBeenCalled();
  });

  it("rejects a non-administrator", async () => {
    await expect(
      addCarPhoto({}, { carId: "1", input }, { currentCustomer: createNewCustomer("9") })
    ).rejects.toThrow(AuthorizationError);
    expect(service.addCarPhoto).not.toHaveBeenCalled();
  });

  it("delegates the decoded image to the service for an administrator", async () => {
    service.addCarPhoto.mockResolvedValue(createNewCar("1"));

    const result = await addCarPhoto(
      {},
      { carId: "1", input },
      { currentCustomer: createAdministrator("admin") }
    );

    expect(service.addCarPhoto).toHaveBeenCalledWith("1", input.data);
    expect(result.carId).toBe("1");
  });
});
