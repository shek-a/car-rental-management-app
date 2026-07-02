import { rentCarToCustomer, returnCarFromCustomer } from "./carRentalService";
import * as carRepository from "@/repository/carRepository";
import * as customerRepository from "@/repository/customerRepository";
import { createNewCar, createNewCustomer } from "@/testing/utilities";

jest.mock("@/repository/carRepository");
jest.mock("@/repository/customerRepository");

const carRepo = carRepository as jest.Mocked<typeof carRepository>;
const customerRepo = customerRepository as jest.Mocked<typeof customerRepository>;

const dueBackDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days out

describe("renting a car for a period", () => {
  beforeEach(() => jest.resetAllMocks());

  it("sets the rental period and owner on an available car", async () => {
    const availableCar = createNewCar("1"); // no customer → available
    const customer = createNewCustomer("1");
    carRepo.findByCarId.mockResolvedValue(availableCar);
    customerRepo.findByCustomerId.mockResolvedValue(customer);
    carRepo.setRentalPeriod.mockResolvedValue(availableCar);

    const result = await rentCarToCustomer("1", "1", dueBackDate);

    const [carId, rentalPeriod, owner] = carRepo.setRentalPeriod.mock.calls[0];
    expect(carId).toBe("1");
    expect(rentalPeriod.dueBackDate).toEqual(dueBackDate);
    expect(rentalPeriod.leaseDate).toBeInstanceOf(Date);
    expect(owner).toBe(customer);
    expect(result).toBe(customer);
  });

  it("throws and stores nothing when the car does not exist", async () => {
    carRepo.findByCarId.mockResolvedValue(null);

    await expect(rentCarToCustomer("missing", "1", dueBackDate)).rejects.toThrow(
      "Car id missing does not exist"
    );
    expect(carRepo.setRentalPeriod).not.toHaveBeenCalled();
  });

  it("throws when the customer does not exist", async () => {
    carRepo.findByCarId.mockResolvedValue(createNewCar("1"));
    customerRepo.findByCustomerId.mockResolvedValue(null);

    await expect(rentCarToCustomer("1", "missing", dueBackDate)).rejects.toThrow(
      "Customer id missing does not exist"
    );
    expect(carRepo.setRentalPeriod).not.toHaveBeenCalled();
  });

  it("rejects renting a car that is already leased", async () => {
    const leasedCar = createNewCar("1", createNewCustomer("2")); // has an owner
    carRepo.findByCarId.mockResolvedValue(leasedCar);
    customerRepo.findByCustomerId.mockResolvedValue(createNewCustomer("1"));

    await expect(rentCarToCustomer("1", "1", dueBackDate)).rejects.toThrow(
      "Car id 1 is already leased out"
    );
    expect(carRepo.setRentalPeriod).not.toHaveBeenCalled();
  });

  it("rejects a due-back date that is not in the future", async () => {
    carRepo.findByCarId.mockResolvedValue(createNewCar("1"));
    customerRepo.findByCustomerId.mockResolvedValue(createNewCustomer("1"));
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await expect(rentCarToCustomer("1", "1", pastDate)).rejects.toThrow();
    expect(carRepo.setRentalPeriod).not.toHaveBeenCalled();
  });
});

describe("returning a car", () => {
  beforeEach(() => jest.resetAllMocks());

  it("clears the rental period for the car the customer holds", async () => {
    const heldCar = createNewCar("1", createNewCustomer("1"));
    const customer = createNewCustomer("1");
    carRepo.findByCarId.mockResolvedValue(heldCar);
    customerRepo.findByCustomerId.mockResolvedValue(customer);
    carRepo.clearRentalPeriod.mockResolvedValue(heldCar);

    const result = await returnCarFromCustomer("1", "1");

    expect(carRepo.clearRentalPeriod).toHaveBeenCalledWith("1", customer);
    expect(result).toBe(customer);
  });

  it("throws when the car does not exist", async () => {
    carRepo.findByCarId.mockResolvedValue(null);

    await expect(returnCarFromCustomer("missing", "1")).rejects.toThrow(
      "Car id missing does not exist"
    );
    expect(carRepo.clearRentalPeriod).not.toHaveBeenCalled();
  });

  it("rejects returning a car the customer does not hold", async () => {
    carRepo.findByCarId.mockResolvedValue(createNewCar("1", createNewCustomer("2")));
    customerRepo.findByCustomerId.mockResolvedValue(createNewCustomer("1"));
    carRepo.clearRentalPeriod.mockResolvedValue(null); // filter did not match this customer

    await expect(returnCarFromCustomer("1", "1")).rejects.toThrow(
      "Car id 1 is not rented by customer id 1"
    );
  });
});
