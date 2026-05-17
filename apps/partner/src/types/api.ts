export type UserRole = 'ADMIN' | 'PARTNER' | 'CUSTOMER';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  approvalStatus?: ApprovalStatus;
  isBanned?: boolean;
  isPartnerRoot?: boolean;
};

/**
 * Shape returned by `GET /auth/me`. Includes the basic account record plus
 * resolved permission keys (`permissions`) and explicitly assigned keys
 * (`assignedPermissionKeys`). Only the profile slot matching `role` is
 * populated.
 */
export type MeResponse = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isSuperAdmin: boolean;
  isPartnerRoot: boolean;
  emailVerifiedAt: string | null;
  permissions: string[];
  assignedPermissionKeys: string[];
  partnerProfile:
    | {
        id: string;
        businessName: string;
        phone: string;
        partnerUserLimit: number;
        partnerPackageLimit?: number;
        approvalStatus: ApprovalStatus;
        isBanned: boolean;
        serviceTypes?: PartnerServiceType[];
      }
    | null;
  adminProfile: { id: string; fullName: string | null } | null;
  customerProfile: { id: string; fullName: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Shape returned by `GET /partner/users/:id/permissions`.
 */
export type PartnerUserPermissionsResponse = {
  user: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    isPartnerRoot: boolean;
  };
  assignedPermissionKeys: string[];
  effectivePermissionKeys: string[];
};

export type PartnerStaffUser = {
  id: string;
  email: string;
  role: 'PARTNER';
  isActive: boolean;
  isPartnerRoot: boolean;
  createdAt: string;
  updatedAt: string;
  assignedPermissionKeys: string[];
  effectivePermissionKeys: string[];
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type ServiceType = {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type RegisterPartnerBody = {
  email: string;
  password: string;
  serviceTypeIds: string[];
  businessName: string;
  phone: string;
  // intentionally omitted in lightweight signup; collected later in profile:
  //   supportingDocuments?: ...
  //   shopLocations?: ...
};

export type VerificationPayload = {
  expiresAt: string;
  verificationUrl?: string;
  token?: string; // dev only
};

export type RegisterPartnerResponse = {
  token?: string;
  user?: AuthUser;
  verification?: VerificationPayload;
};

export type ResendVerificationResponse = {
  verification?: VerificationPayload;
};

export type Address = {
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type CoverageRegion = {
  id: number;
  code: string;
  name: string;
};

export type CoverageCity = {
  id: number;
  coverageRegionId: number;
  name: string;
};

export type PartnerServiceCoverageArea = {
  id: string;
  partnerId: string;
  serviceTypeId: string;
  coverageRegionId: number;
  coverageCityId: number;
  isActive: boolean;
  serviceType?: ServiceType;
  coverageRegion?: CoverageRegion & { isActive?: boolean };
  coverageCity?: CoverageCity & { isActive?: boolean };
};

export type PartnerShopLocationInput = Address & {
  contactPhone?: string | null;
  notes?: string | null;
  isDefault?: boolean;
};

export type PartnerServiceType = {
  partnerId: string;
  serviceTypeId: string;
  createdAt: string;
  serviceType: ServiceType;
};

export type PartnerDocument = {
  id: string;
  partnerId: string;
  documentType: string | null;
  fileName: string;
  objectKey: string;
  storageBucket: string | null;
  storageProvider: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  publicUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerShopLocation = Address & {
  id: string;
  partnerId: string;
  contactPhone: string | null;
  notes: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalAction =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMITTED';

export type ApprovalLog = {
  id: string;
  partnerId: string;
  actorId: string | null;
  action: ApprovalAction;
  comment: string | null;
  createdAt: string;
};

export type PartnerApplication = {
  id: string;
  userId?: string;
  businessName: string;
  phone: string;
  partnerUserLimit: number;
  approvalStatus: ApprovalStatus;
  approvalComment: string | null;
  approvedAt: string | null;
  approvedById: string | null;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  updatedAt: string;
  serviceTypes: PartnerServiceType[];
  serviceCoverageAreas?: PartnerServiceCoverageArea[];
  documents: PartnerDocument[];
  shopLocations: PartnerShopLocation[];
  approvalLogs: ApprovalLog[];
};

export type PartnerPackage = {
  id: string;
  partnerId: string;
  serviceTypeId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  estimatedDurationMinutes: number;
  features: string[];
  badgeLabel: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  serviceType?: ServiceType & {
    description?: string | null;
    detailModelKey?: string | null;
    fulfillmentMode?: string | null;
    requiresAddress?: boolean | null;
    isActive?: boolean;
  };
};

export type PartnerPackagePayload = {
  serviceTypeId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  estimatedDurationMinutes: number;
  features: string[];
  badgeLabel?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

// ---------- Bookings ------------------------------------------------------

export type BookingStatus =
  | 'PENDING_ASSIGNMENT'
  | 'AWAITING_PARTNER_APPROVAL'
  | 'PARTNER_APPROVED'
  | 'RELEASED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type BookingStatusGroup =
  | 'active'
  | 'released'
  | 'completed'
  | 'cancelled';

/**
 * Presentation metadata for a Booking.status, supplied by the backend so the
 * UI doesn't hardcode enum text or permission rules. Business rules still come
 * from server validation — these flags are for showing/hiding affordances.
 */
export type BookingStatusMeta = {
  label: string;
  description: string;
  group: BookingStatusGroup;
  partnerCanApprove?: boolean;
  partnerCanRelease?: boolean;
  partnerCanStart?: boolean;
  partnerCanComplete?: boolean;
};

export type BookingSelectionMode = 'PACKAGE' | 'CUSTOM_REQUEST';

export type BookingStatusLog = {
  id: string;
  bookingId: string;
  actorId: string | null;
  status: BookingStatus;
  note: string | null;
  metadata: unknown | null;
  createdAt: string;
};

export type BookingCustomer = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  defaultAddress?: Address | null;
  createdAt: string;
  updatedAt: string;
  user?: { email: string } | null;
};

/**
 * Booking shape returned by `/partner/bookings` and `/partner/bookings/:id`.
 * The list endpoint and detail endpoint return the same shape; numeric fields
 * are sometimes serialized as strings (Decimal columns), so the form helpers
 * tolerate both.
 */
export type Booking = {
  id: string;
  bookingCode: string;
  customerId: string | null;
  partnerId: string | null;
  createdByUserId: string | null;
  serviceTypeId: string;
  partnerPackageId: string | null;
  selectionMode: BookingSelectionMode | null;
  status: BookingStatus;
  statusMeta?: BookingStatusMeta;
  scheduledAt: string;
  serviceAddress: Address | null;
  price: number | string;
  discountPrice: number | string | null;
  currency: string;
  packageName: string | null;
  packagePrice: number | string | null;
  packageCurrency: string | null;
  packageEstimatedDurationMinutes: number | null;
  packageFeatures: string[] | null;
  customRequestText: string | null;
  customRequestBudget: number | string | null;
  notes: string | null;
  detailsJson: unknown | null;
  releaseComment: string | null;
  approvedAt: string | null;
  releasedAt: string | null;
  isGuestBooking?: boolean;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: BookingCustomer | null;
  serviceType?: ServiceType | null;
  partnerPackage?: PartnerPackage | null;
  statusLogs?: BookingStatusLog[];
  carWashDetails?: Record<string, unknown> | null;
  homeCleaningDetails?: Record<string, unknown> | null;
  propertyCleaningDetails?: Record<string, unknown> | null;
  laundryDetails?: Record<string, unknown> | null;
  transitionServiceDetails?: Record<string, unknown> | null;
  maintenanceCleaningDetails?: Record<string, unknown> | null;
  commercialCleaningServiceDetails?: Record<string, unknown> | null;
};

export type PartnerBookingCustomer = BookingCustomer;

export type PartnerCreateBookingPayload = {
  customerId: string;
  serviceTypeId: string;
  selectionMode: BookingSelectionMode;
  partnerPackageId?: string | null;
  customRequestText?: string | null;
  customRequestBudget?: number | null;
  scheduledAt: string;
  serviceAddress?: Address | null;
  currency?: string;
  notes?: string | null;
};

export type PartnerUpdateBookingPayload = {
  serviceTypeId?: string;
  selectionMode?: BookingSelectionMode | null;
  partnerPackageId?: string | null;
  customRequestText?: string | null;
  customRequestBudget?: number | null;
  scheduledAt?: string;
  serviceAddress?: Address | null;
  currency?: string;
  notes?: string | null;
};

export type PartnerReleaseBookingPayload = {
  releaseComment: string;
};

/**
 * Shape returned by GET /partner/reviews (and the equivalent admin endpoint).
 * Numeric `rating` is 1-5.
 */
export type PartnerReview = {
  id: string;
  bookingId: string;
  customerId: string;
  partnerId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    bookingCode: string;
    scheduledAt: string;
    status: BookingStatus;
    serviceType?: ServiceType | null;
    partnerPackage?: { id: string; name: string } | null;
  } | null;
  customer?: {
    id: string;
    fullName: string;
    phone?: string | null;
    user?: { email: string } | null;
  } | null;
};
