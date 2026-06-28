import { Request, Response } from "express";
import { carPhotoRouteHandler } from "./carPhotoRoute";
import { carPhotoStorage } from "@/storage/carPhotoStorageProvider";

jest.mock("@/storage/carPhotoStorageProvider");

const storage = { save: jest.fn(), load: jest.fn(), delete: jest.fn() };
(carPhotoStorage as jest.Mock).mockReturnValue(storage);

const fakeResponse = () => {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
  return res;
};

const requestFor = (carId: string) => ({ params: { carId } } as unknown as Request);

describe("serving a car photo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (carPhotoStorage as jest.Mock).mockReturnValue(storage);
  });

  it("streams the bytes with the stored content type when a photo exists", async () => {
    const bytes = Buffer.from([0xff, 0xd8, 0xff]);
    storage.load.mockResolvedValue({ bytes, contentType: "image/jpeg" });
    const res = fakeResponse();

    await carPhotoRouteHandler(requestFor("car-1"), res as unknown as Response);

    expect(storage.load).toHaveBeenCalledWith("car-1");
    expect(res.statusCode).toBe(200);
    expect(res.headers["Content-Type"]).toBe("image/jpeg");
    expect(res.body).toBe(bytes);
  });

  it("responds 404 when the car has no photo", async () => {
    storage.load.mockResolvedValue(null);
    const res = fakeResponse();

    await carPhotoRouteHandler(requestFor("missing"), res as unknown as Response);

    expect(res.statusCode).toBe(404);
  });
});
