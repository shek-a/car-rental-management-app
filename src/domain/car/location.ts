// Location — a value object for the place where a car is picked up and returned. Identity-less,
// immutable, and compared by value: two locations are the same place when their names match
// ignoring letter case and surrounding whitespace. The trimmed original casing is kept for display.

export interface Location {
  readonly value: string;
}

export const createLocation = (rawLocation: string): Location => {
  const value = rawLocation.trim();
  if (value.length === 0) {
    throw new Error("A location must not be blank");
  }
  return Object.freeze({ value });
};

export const locationsEqual = (a: Location, b: Location): boolean =>
  a.value.toLowerCase() === b.value.toLowerCase();
