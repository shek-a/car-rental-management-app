import { createLocation, locationsEqual } from "./location";

describe("car location", () => {
  it("captures a place name, trimmed of surrounding whitespace", () => {
    expect(createLocation("  Melbourne  ").value).toBe("Melbourne");
  });

  it("preserves the original casing for display", () => {
    expect(createLocation("melbourne, VIC").value).toBe("melbourne, VIC");
  });

  it.each(["", "   ", "\t\n"])("rejects a blank location (%j)", (blank) => {
    expect(() => createLocation(blank)).toThrow("A location must not be blank");
  });

  it("is immutable", () => {
    expect(Object.isFrozen(createLocation("Melbourne"))).toBe(true);
  });

  it("treats locations differing only in case or surrounding whitespace as the same place", () => {
    expect(
      locationsEqual(createLocation(" melbourne "), createLocation("Melbourne"))
    ).toBe(true);
  });

  it("treats different place names as different locations", () => {
    expect(
      locationsEqual(createLocation("Melbourne"), createLocation("Sydney"))
    ).toBe(false);
  });
});
