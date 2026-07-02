// RentalPeriod — a value object describing the period a car is currently rented for. Immutable and
// compared by value. Present on a car while it is rented; absent when available. Persisted via the
// car's existing leasedDate (→ leaseDate) and returnDate (→ dueBackDate).

export interface RentalPeriod {
  readonly leaseDate: Date;
  readonly dueBackDate: Date;
}

export const createRentalPeriod = (
  leaseDate: Date,
  dueBackDate: Date
): RentalPeriod => {
  if (Number.isNaN(leaseDate.getTime()) || Number.isNaN(dueBackDate.getTime())) {
    throw new Error("A rental period requires valid lease and due-back dates");
  }
  if (dueBackDate.getTime() <= leaseDate.getTime()) {
    throw new Error("A rental period's due-back date must be after its lease date");
  }
  return Object.freeze({ leaseDate, dueBackDate });
};

// Read-side projection: reconstruct the RentalPeriod from a car's persisted dates. Lenient (returns
// null rather than throwing) because these dates were already validated when the car was rented.
export const rentalPeriodFromDates = (
  leaseDate: Date | null | undefined,
  dueBackDate: Date | null | undefined
): RentalPeriod | null => {
  if (!leaseDate || !dueBackDate) {
    return null;
  }
  const lease = new Date(leaseDate);
  const due = new Date(dueBackDate);
  if (Number.isNaN(lease.getTime()) || Number.isNaN(due.getTime())) {
    return null;
  }
  return Object.freeze({ leaseDate: lease, dueBackDate: due });
};
