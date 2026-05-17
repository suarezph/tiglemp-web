export type UserRole = 'ADMIN' | 'PARTNER' | 'CUSTOMER';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  isSuperAdmin?: boolean;
};

export type Permission = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Shape returned by `GET /auth/me`. Includes the basic account record plus
 * the resolved permission keys (`permissions`) and the keys explicitly
 * assigned to this user (`assignedPermissionKeys`). Only the profile slot
 * matching `role` is populated.
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
  adminProfile: AdminProfile | null;
  // Lightweight profile summaries for partner / customer users — typed loose
  // here because admin app rarely cares about the inner shape.
  partnerProfile: { id: string; businessName: string } | null;
  customerProfile: { id: string; fullName: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Shape returned by `GET /admin/users/:id/permissions` and
 * `GET /partner/users/:id/permissions`.
 */
export type UserPermissionsResponse = {
  user: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    isPartnerRoot?: boolean;
    isSuperAdmin?: boolean;
  };
  assignedPermissionKeys: string[];
  effectivePermissionKeys: string[];
};

export type AdminProfile = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isPartnerRoot: boolean;
  isSuperAdmin: boolean;
  adminProfile: AdminProfile | null;
  partnerProfileId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedReason?: string | null;
  assignedPermissionKeys: string[];
  effectivePermissionKeys: string[];
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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

export type EmbeddedUser = {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export type ServiceType = {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
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

export type PartnerShopLocationInput = Address & {
  contactPhone?: string | null;
  notes?: string | null;
  isDefault?: boolean;
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

export type PartnerUser = {
  id: string;
  email: string;
  isActive: boolean;
  isPartnerRoot: boolean;
  createdAt: string;
};

export type Partner = {
  id: string;
  businessName: string;
  phone: string;
  partnerUserLimit: number;
  partnerPackageLimit: number;
  approvalStatus: ApprovalStatus;
  approvalComment: string | null;
  approvedAt: string | null;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  users: PartnerUser[];
  serviceTypes: PartnerServiceType[];
  serviceCoverageAreas?: PartnerServiceCoverageArea[];
  documents: PartnerDocument[];
  shopLocations: PartnerShopLocation[];
  approvalLogs?: ApprovalLog[];
};

export type Customer = {
  id: string;
  fullName: string;
  phone: string;
  defaultAddress: Address | null;
  createdAt: string;
  user: EmbeddedUser;
};

export type BookingSelectionMode = 'PACKAGE' | 'CUSTOM_REQUEST';

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
 * admin UI doesn't hardcode enum text. Business rules still come from server
 * validation.
 */
export type BookingStatusMeta = {
  label: string;
  description: string;
  group: BookingStatusGroup;
};

export type BookingStatusLog = {
  id: string;
  bookingId: string;
  actorId?: string | null;
  status: BookingStatus;
  note?: string | null;
  comment?: string | null;
  metadata?: unknown | null;
  createdAt: string;
};

/**
 * Shape of a partner package as embedded on a Booking or returned by
 * `GET /admin/partners/:id/packages`.
 */
export type BookingPartnerPackage = {
  id: string;
  partnerId?: string;
  serviceTypeId: string;
  name: string;
  description?: string | null;
  price: number | string;
  currency: string;
  estimatedDurationMinutes: number;
  features: string[];
  badgeLabel?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type BookingCustomerSummary = {
  id: string;
  userId?: string;
  fullName: string;
  phone?: string | null;
  defaultAddress?: Address | null;
  user?: { id?: string; email: string } | null;
};

export type BookingPartnerSummary = {
  id: string;
  businessName: string;
  phone?: string | null;
  users?: Array<{ email: string; isPartnerRoot?: boolean; isActive?: boolean }>;
};

export type Booking = {
  id: string;
  bookingCode: string;
  customerId: string | null;
  partnerId: string | null;
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
  releaseComment: string | null;
  approvedAt?: string | null;
  releasedAt: string | null;
  isGuestBooking?: boolean;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  hasReview?: boolean;
  canReview?: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: BookingCustomerSummary | null;
  partner?: BookingPartnerSummary | null;
  serviceType?: ServiceType | null;
  partnerPackage?: BookingPartnerPackage | null;
  statusLogs?: BookingStatusLog[];
  carWashDetails?: Record<string, unknown> | null;
  homeCleaningDetails?: Record<string, unknown> | null;
  propertyCleaningDetails?: Record<string, unknown> | null;
  laundryDetails?: Record<string, unknown> | null;
  transitionServiceDetails?: Record<string, unknown> | null;
  maintenanceCleaningDetails?: Record<string, unknown> | null;
  commercialCleaningServiceDetails?: Record<string, unknown> | null;
};

/**
 * Customer-submitted review for a partner. Returned by
 * GET /admin/partners/:id/reviews. Rating is 1-5.
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

