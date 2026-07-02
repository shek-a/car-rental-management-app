# Authorization

## Roles

Every `Customer` has a `role` (the `CustomerRole` enum):

| Role | Can do |
|------|--------|
| `CUSTOMER` | Browse cars (public), rent and return cars **against their own account** |
| `ADMINISTRATOR` | Everything a customer can, **plus** manage the fleet (create/delete cars), manage car photos, and grant the administrator role to others |

A signed-in user's role is on `Customer.role` — query it after sign-in to decide which UI to show
(e.g. reveal admin screens only for `ADMINISTRATOR`).

## Accounts are created automatically

There is no "register" screen. The first time someone signs in with Google, the backend provisions a
`Customer` for them (linked to their Google identity, email and name pre-filled, role `CUSTOMER`).
Returning users resolve to the same account. One Google identity = one `Customer`.

A single configured **seed administrator** email is granted `ADMINISTRATOR` automatically on sign-in;
that admin can promote others with `grantAdministratorRole`.

## Authorization matrix

What each operation requires. "Own account" means the `customerId` argument must equal the
signed-in customer's own id.

| Operation | Auth required | Rule |
|-----------|---------------|------|
| `cars`, `car`, `customers`, `customer` (queries) | No | **Public** |
| `createCustomer` | No | Public |
| `updateCustomer` | No | ⚠️ **Unprotected** (see below) |
| `deleteCustomer` | No | ⚠️ **Unprotected** (see below) |
| `createCar` | Yes | **Administrator** only |
| `updateCar` | Yes | **Administrator** only |
| `deleteCar` | Yes | **Administrator** only (also deletes the car's photo) |
| `addCarToCustomer` (rent) | Yes | **Own account** only |
| `removeCarFromCustomer` (return) | Yes | **Own account** only |
| `grantAdministratorRole` | Yes | **Administrator** only |
| `addCarPhoto` | Yes | **Administrator** only |
| `removeCarPhoto` | Yes | **Administrator** only |

When a request violates a rule, the API returns an error — see [errors.md](./errors.md):

- **Not signed in** on a protected operation → authentication error ("Authentication required").
- **Signed in but wrong role / not your account** → authorization error ("Administrator role
  required" or "You can only act on your own account").

## ⚠️ Unprotected mutations (known gap)

`updateCustomer` and `deleteCustomer` currently have **no authorization checks** — any caller (even
unauthenticated) can invoke them. This is a known backend gap, not intended behavior. (`updateCar` is
now administrator-only.)

For now:
- Do not expose these as if they were safe, and don't rely on the backend to reject misuse.
- Gate them in your UI (e.g. only show "edit profile" / "delete account" to the signed-in owner, and
  fleet edits to admins).
- Flag to the backend team that these need guards (`requireOwnAccount` / `requireAdministrator`)
  before production.

## Practical guidance

- Read `Customer.role` once after sign-in and cache it to drive navigation/feature flags.
- Treat the matrix as the source of truth for *which* requests need a token — sending a token on a
  public request is harmless, but omitting it on a protected one will fail.
- Role is re-evaluated by the server on every request, so a freshly-granted admin takes effect
  immediately (no re-login needed).
