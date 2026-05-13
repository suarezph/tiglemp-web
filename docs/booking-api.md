# Booking API — backend requirements

This document captures every endpoint the customer-side booking flow needs.
The frontend wizard is already built against stub data; once these endpoints
are live we swap the stubs for real `useQuery` / `useMutation` calls.

## Conventions

- All endpoints live under the existing API base URL (e.g. `/api/v1`).
- Success responses use the standard envelope:
  ```json
  { "success": true, "message": null, "data": <payload>, "meta": null }
  ```
- Error responses use the standard error envelope:
  ```json
  {
    "success": false,
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "formErrors": ["..."],
      "fieldErrors": { "fieldName": ["..."] }
    }
  }
  ```
- `Authorization: Bearer <customer_token>` is required wherever an authed
  customer context is needed. Guest endpoints are explicitly noted.

---

## 1. List partners for a search

`GET /partners/search`

Returns approved, unbanned partners whose `serviceCoverageAreas` match the
caller's filters. Used by the **`/search` results page**.

### Query params

| Name             | Type     | Required | Notes                                                       |
| ---------------- | -------- | -------- | ----------------------------------------------------------- |
| `serviceTypeId`  | uuid     | yes      | Must match `serviceCoverageAreas.serviceTypeId`             |
| `coverageCityId` | integer  | yes      | Must match `serviceCoverageAreas.coverageCityId`            |
| `at`             | ISO 8601 | no       | Preferred service time; carried forward, not yet a filter   |
| `sort`           | enum     | no       | `top_rated` (default) \| `most_recent` \| `lowest_price`    |
| `limit`          | integer  | no       | Default 20, max 50                                          |
| `cursor`         | string   | no       | Opaque cursor for pagination                                |

### 200 success

```json
{
  "success": true,
  "message": null,
  "data": {
    "items": [
      {
        "id": "partner-profile-uuid",
        "businessName": "Bright Shine Carwash",
        "blurb": "Mobile and on-site carwash crew with a 4.8★ track record.",
        "ratingAverage": 4.8,
        "ratingCount": 1242,
        "yearsOnPlatform": 3,
        "baseFromPHP": 350,
        "packageCount": 4,
        "supportsCustomRequests": true
      }
    ],
    "nextCursor": null
  },
  "meta": { "total": 1 }
}
```

### Error responses

- **400 `VALIDATION_ERROR`** — missing `serviceTypeId` / `coverageCityId`,
  or unknown values.
  ```json
  {
    "success": false,
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "formErrors": [],
      "fieldErrors": {
        "coverageCityId": ["coverageCityId must be a valid integer"]
      }
    }
  }
  ```

- **404 `NOT_FOUND`** if `serviceTypeId` or `coverageCityId` does not exist.

---

## 2. Auto-assign — "let Tiglemp pick"

`POST /partners/auto-assign`

Returns the single best-fit partner for the same filters. Implementation can
be: rotation, capacity-aware, rating-weighted random — backend's choice. The
frontend treats the result as a normal partner pick and flags it as
auto-assigned in the UI.

### Body

```json
{
  "serviceTypeId": "service-type-uuid",
  "coverageCityId": 18,
  "at": "2026-05-15T03:00:00.000Z"
}
```

### 200 success

```json
{
  "success": true,
  "message": null,
  "data": {
    "partner": {
      "id": "partner-profile-uuid",
      "businessName": "Bright Shine Carwash",
      "blurb": "Mobile and on-site carwash crew with a 4.8★ track record.",
      "ratingAverage": 4.8,
      "ratingCount": 1242,
      "yearsOnPlatform": 3,
      "baseFromPHP": 350,
      "packageCount": 4,
      "supportsCustomRequests": true
    },
    "assignmentReason": "top_rated_in_area"
  },
  "meta": null
}
```

### Error responses

- **404 `NO_PARTNER_AVAILABLE`** — no partner matches the filters.
  ```json
  {
    "success": false,
    "code": "NO_PARTNER_AVAILABLE",
    "message": "No partner available for this area and service",
    "details": {
      "formErrors": ["No partner available for this area and service"],
      "fieldErrors": {}
    }
  }
  ```
- **400 `VALIDATION_ERROR`** as in §1.

---

## 3. List a partner's packages

`GET /partners/:partnerId/packages`

Used by the **packages step** of the booking wizard.

### Query params

| Name            | Type | Required | Notes                                                |
| --------------- | ---- | -------- | ---------------------------------------------------- |
| `serviceTypeId` | uuid | yes      | Filter packages to the service the customer chose    |

### 200 success — partner publishes packages

```json
{
  "success": true,
  "message": null,
  "data": {
    "partner": {
      "id": "partner-profile-uuid",
      "businessName": "Bright Shine Carwash",
      "blurb": "Mobile and on-site carwash crew with a 4.8★ track record.",
      "ratingAverage": 4.8,
      "ratingCount": 1242,
      "supportsCustomRequests": true
    },
    "packages": [
      {
        "id": "package-uuid",
        "name": "Standard Wash",
        "description": "Exterior soap, rinse, and hand-dry. Tyre dressing and interior vacuum.",
        "priceFromPHP": 350,
        "durationMinutes": 45,
        "inclusions": ["Exterior wash", "Hand dry", "Tyre dressing"],
        "popular": false,
        "isActive": true
      }
    ]
  },
  "meta": null
}
```

### 200 success — partner has NO packages

When `packages` is empty AND `supportsCustomRequests` is true, the frontend
hides the "Packages" tab and only renders the **custom request** form.

```json
{
  "success": true,
  "message": null,
  "data": {
    "partner": { "...": "see above", "supportsCustomRequests": true },
    "packages": []
  },
  "meta": null
}
```

### Error responses

- **404 `NOT_FOUND`** if partner does not exist or is not approved/active.
- **400 `VALIDATION_ERROR`** if `serviceTypeId` missing.
- **422 `SERVICE_TYPE_NOT_OFFERED`** if the partner does not serve that
  service type:
  ```json
  {
    "success": false,
    "code": "SERVICE_TYPE_NOT_OFFERED",
    "message": "This partner does not offer the requested service type",
    "details": {
      "formErrors": ["This partner does not offer the requested service type"],
      "fieldErrors": {}
    }
  }
  ```

---

## 4. Create a booking

`POST /bookings`

Used by the **review step**. Supports two callers:

- **Authed customer** — `Authorization: Bearer <customer_token>` set. The
  body must NOT include `guestContact`.
- **Guest** — no `Authorization` header. The body MUST include
  `guestContact`.

### Body (authed customer, package pick)

```json
{
  "partnerId": "partner-profile-uuid",
  "serviceTypeId": "service-type-uuid",
  "scheduledAt": "2026-05-15T03:00:00.000Z",
  "package": {
    "packageId": "package-uuid"
  },
  "address": {
    "line1": "123 Osmena Blvd",
    "line2": null,
    "city": "Cebu City",
    "state": "Cebu",
    "postalCode": "6000",
    "country": "Philippines",
    "notes": "Ring intercom"
  },
  "autoAssigned": false
}
```

### Body (guest, custom request, no address needed)

```json
{
  "partnerId": "partner-profile-uuid",
  "serviceTypeId": "service-type-uuid",
  "scheduledAt": "2026-05-15T03:00:00.000Z",
  "customRequest": {
    "description": "3-BR house, kitchen + bathrooms only, eco-friendly products please.",
    "budgetPHP": 3500
  },
  "guestContact": {
    "fullName": "Juan dela Cruz",
    "email": "juan@example.com",
    "phone": "+639171234567"
  },
  "autoAssigned": true
}
```

### Field rules

| Field                            | Required           | Notes                                                                                       |
| -------------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| `partnerId`                      | yes                | UUID of an approved partner                                                                 |
| `serviceTypeId`                  | yes                | UUID; must be one of the partner's service types                                            |
| `scheduledAt`                    | yes                | ISO 8601 in the future                                                                      |
| `package.packageId`              | one of             | Exactly one of `package` or `customRequest` must be present                                 |
| `customRequest.description`      | one of             | Min 10 chars, max 500                                                                       |
| `customRequest.budgetPHP`        | no                 | Integer ≥ 0                                                                                 |
| `address`                        | conditional        | Required when the service type's `requiresAddress` is true                                  |
| `address.notes`                  | no                 | Max 500 chars                                                                               |
| `guestContact`                   | when not authed    | Required for guests; rejected for authed customers                                          |
| `guestContact.fullName/email/phone` | yes (when guest) | Standard validation                                                                         |
| `autoAssigned`                   | no                 | Boolean; frontend sets `true` when the partner came from `/partners/auto-assign`            |

### 201 success

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "booking-uuid",
    "reference": "TGM-2K91X3",
    "status": "PENDING_PARTNER",
    "partner": {
      "id": "partner-profile-uuid",
      "businessName": "Bright Shine Carwash"
    },
    "serviceType": {
      "id": "service-type-uuid",
      "name": "Carwash"
    },
    "scheduledAt": "2026-05-15T03:00:00.000Z",
    "package": {
      "id": "package-uuid",
      "name": "Standard Wash",
      "priceFromPHP": 350
    },
    "customRequest": null,
    "address": {
      "line1": "123 Osmena Blvd",
      "city": "Cebu City",
      "state": "Cebu",
      "postalCode": "6000",
      "country": "Philippines",
      "notes": "Ring intercom"
    },
    "guestContact": null,
    "autoAssigned": false,
    "createdAt": "2026-05-13T10:00:00.000Z"
  },
  "meta": null
}
```

### Status enum

`PENDING_PARTNER` → `ACCEPTED` → `IN_PROGRESS` → `COMPLETED`
(branches: `DECLINED`, `CANCELLED_BY_CUSTOMER`, `CANCELLED_BY_PARTNER`,
`NO_SHOW`).

### Error responses

- **400 `VALIDATION_ERROR`** — typical zod validation problems:
  ```json
  {
    "success": false,
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "formErrors": [],
      "fieldErrors": {
        "scheduledAt": ["scheduledAt must be in the future"],
        "customRequest.description": [
          "Custom request must be at least 10 characters"
        ]
      }
    }
  }
  ```

- **400 `PACKAGE_OR_CUSTOM_REQUIRED`** when both/neither is supplied:
  ```json
  {
    "success": false,
    "code": "PACKAGE_OR_CUSTOM_REQUIRED",
    "message": "Exactly one of package or customRequest is required",
    "details": {
      "formErrors": [
        "Exactly one of package or customRequest is required"
      ],
      "fieldErrors": {}
    }
  }
  ```

- **400 `ADDRESS_REQUIRED`** when the service type needs an address but none
  was provided:
  ```json
  {
    "success": false,
    "code": "ADDRESS_REQUIRED",
    "message": "Address is required for this service",
    "details": {
      "formErrors": ["Address is required for this service"],
      "fieldErrors": {}
    }
  }
  ```

- **400 `GUEST_CONTACT_REQUIRED`** when guest has no `guestContact` block.

- **400 `GUEST_CONTACT_NOT_ALLOWED`** when an authed customer sends a
  `guestContact` block.

- **404 `PARTNER_NOT_FOUND`** unknown / banned / suspended partner.

- **404 `PACKAGE_NOT_FOUND`** the package id doesn't belong to the partner
  or is inactive.

- **409 `PARTNER_CAPACITY_EXCEEDED`** partner can't take a booking at the
  requested time:
  ```json
  {
    "success": false,
    "code": "PARTNER_CAPACITY_EXCEEDED",
    "message": "This partner is fully booked at the requested time",
    "details": {
      "formErrors": [
        "This partner is fully booked at the requested time"
      ],
      "fieldErrors": {}
    }
  }
  ```

- **422 `COVERAGE_MISMATCH`** the partner doesn't cover the address city:
  ```json
  {
    "success": false,
    "code": "COVERAGE_MISMATCH",
    "message": "Partner does not cover this address",
    "details": {
      "formErrors": ["Partner does not cover this address"],
      "fieldErrors": {}
    }
  }
  ```

---

## 5. Lookup a booking by id

`GET /bookings/:id`

Used by the **confirmation page** and (later) the customer dashboard.

- Authed customer: returns their own booking, regardless of status.
- Guest: must include the `?email=` query param matching the `guestContact.email`
  used at creation. Returns 401 otherwise.

### 200 success

Identical payload to the `POST /bookings` 201 response.

### Error responses

- **401 `UNAUTHORIZED`** — guest missing or wrong `email` query param.
- **404 `NOT_FOUND`** — booking does not exist.
- **403 `FORBIDDEN`** — authed customer querying someone else's booking.

---

## 6. Customer dashboard — list my bookings

`GET /me/bookings`

Returns the authed customer's bookings, newest first.

### Query params

| Name     | Type    | Required | Notes                                       |
| -------- | ------- | -------- | ------------------------------------------- |
| `status` | enum    | no       | Filter by booking status (CSV allowed)      |
| `limit`  | integer | no       | Default 20, max 50                          |
| `cursor` | string  | no       | Opaque cursor                               |

### 200 success

```json
{
  "success": true,
  "message": null,
  "data": {
    "items": [{ "...": "same shape as POST /bookings 201 data" }],
    "nextCursor": null
  },
  "meta": { "total": 0 }
}
```

### Error responses

- **401 `UNAUTHORIZED`** — missing / expired bearer token.

---

## Touchpoint with existing endpoints

The booking wizard relies on these already-built endpoints; nothing new is
needed for them.

- `GET /meta/service-types` — used to render the hero tabs and the services
  grid. Each `ServiceType` must keep these fields the frontend already
  consumes: `id`, `code`, `name`, `description`, `requiresAddress`,
  `fulfillmentMode`, `detailModelKey`, `isActive`.
- `GET /json/regions.json` — used for the Region dropdown.
- `GET /json/cities.json` — used for the City dropdown, filtered by
  selected region's `id`.

---

## Out-of-scope for v1 (flag for later)

- **Payments** — pricing is shown but payment collection is not part of v1.
  Bookings are cash / e-wallet on the day. We'll need
  `POST /bookings/:id/payments` later.
- **Live slot availability** — `scheduledAt` is currently a customer
  preference. Adding "show only open slots" needs a partner-side calendar
  endpoint (`GET /partners/:id/availability`).
- **Service-detail forms** — services like aircon (per-unit count) and
  carwash (vehicle type) will eventually carry structured per-service detail
  fields. We've left `serviceType.detailModelKey` reserved for this.
- **Partner-side acceptance UI** — the partner portal needs a screen to
  accept/decline bookings. This document covers the customer side only.

---

## Suggested rollout order

1. `GET /partners/search` and `POST /partners/auto-assign` — unblocks the
   results page and the "No preference" CTA.
2. `GET /partners/:partnerId/packages` — unblocks the packages step.
3. `POST /bookings` and `GET /bookings/:id` — unblocks the review and
   confirmation steps.
4. `GET /me/bookings` — unblocks the customer dashboard ("My bookings").

Each numbered step is an independently deployable slice; the frontend already
works against stubs so we can integrate one endpoint at a time without
breaking anything else.
