export type ServiceFulfillmentMode = 'ON_SITE' | 'IN_SHOP' | 'BOTH';

export type ServiceType = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  fulfillmentMode?: ServiceFulfillmentMode;
  requiresAddress?: boolean;
  detailModelKey?: string | null;
  isActive?: boolean;
};

export type PartnerReviewSummary = {
  averageRating: number;
  totalReviews: number;
};

export type SearchPartnerResult = {
  id: string;
  businessName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  serviceType: ServiceType;
  reviewSummary: PartnerReviewSummary;
  matchContext?: {
    channels?: string[];
    fulfillmentMode?: ServiceFulfillmentMode;
    region?: { id: number; code: string; name: string };
    city?: { id: number; coverageRegionId: number; name: string };
  };
  matchedCoverageAreas?: unknown[];
  matchedShopLocations?: unknown[];
};

export type AutoMatchMeta = {
  total?: number;
  autoMatch?: { strategy?: string; notes?: string };
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
  serviceType?: Pick<ServiceType, 'id' | 'code' | 'name'>;
};

export type PartnerPackagesResponse = {
  partner: {
    id: string;
    businessName: string;
    phone: string;
    reviewSummary?: PartnerReviewSummary;
  };
  serviceType: ServiceType;
  packages: PartnerPackage[];
  customRequestAllowed: boolean;
};

export type BookingSelectionMode = 'PACKAGE' | 'CUSTOM_REQUEST';

export type BookingServiceAddressPayload = {
  label?: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type CreateBookingBasePayload = {
  partnerId: string;
  serviceTypeId: string;
  selectionMode: BookingSelectionMode;
  partnerPackageId?: string;
  customRequestText?: string;
  customRequestBudget?: number;
  scheduledAt: string;
  serviceAddress?: BookingServiceAddressPayload;
  currency: string;
  notes?: string;
};

export type GuestContactPayload = {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
};

export type CreateGuestBookingPayload = CreateBookingBasePayload &
  GuestContactPayload;

export type CustomerBookingStatus =
  | 'PENDING_ASSIGNMENT'
  | 'AWAITING_PARTNER_APPROVAL'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'RELEASED'
  | string;

export type CustomerBookingListItem = {
  id: string;
  bookingCode: string;
  partnerId: string;
  serviceTypeId?: string;
  partnerPackageId?: string | null;
  selectionMode?: BookingSelectionMode;
  status: CustomerBookingStatus;
  scheduledAt: string;
  serviceAddress: BookingServiceAddressPayload | null;
  price: number | string | null;
  discountPrice?: number | string | null;
  currency: string | null;
  packageName?: string | null;
  customRequestText?: string | null;
  customRequestBudget?: number | string | null;
  notes?: string | null;
  hasReview?: boolean;
  canReview?: boolean;
  createdAt: string;
  updatedAt: string;
  serviceType?: {
    id: string;
    code: string;
    name: string;
  };
  partner?: {
    id: string;
    businessName: string;
  };
};

export type BookingStatusLog = {
  id: string;
  bookingId: string;
  actorId: string | null;
  status: CustomerBookingStatus;
  note: string | null;
  metadata: unknown | null;
  createdAt: string;
};

export type CustomerBookingDetail = CustomerBookingListItem & {
  customerId: string | null;
  createdByUserId?: string | null;
  detailsJson?: unknown | null;
  isGuestBooking?: boolean;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestClaimedAt?: string | null;
  releaseComment?: string | null;
  approvedAt?: string | null;
  releasedAt?: string | null;
  packagePrice?: number | null;
  packageCurrency?: string | null;
  packageEstimatedDurationMinutes?: number | null;
  packageFeatures?: string[] | null;
  customRequestBudget?: number | null;
  partnerPackage?: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    currency: string;
    estimatedDurationMinutes: number;
    features: string[];
    badgeLabel: string | null;
  } | null;
  partner?: {
    id: string;
    businessName: string;
    phone?: string | null;
    users?: Array<{
      email: string;
      isPartnerRoot?: boolean;
      isActive?: boolean;
    }>;
  };
  review?: unknown | null;
  statusLogs?: BookingStatusLog[];
};

export type BookingResponse = {
  id: string;
  bookingCode: string;
  customerId: string | null;
  partnerId: string;
  serviceTypeId: string;
  partnerPackageId: string | null;
  selectionMode: BookingSelectionMode;
  status: string;
  scheduledAt: string;
  serviceAddress: BookingServiceAddressPayload | null;
  price: number;
  discountPrice: number | null;
  currency: string;
  packageName: string | null;
  packagePrice: number | null;
  packageCurrency: string | null;
  packageEstimatedDurationMinutes: number | null;
  packageFeatures: string[] | null;
  customRequestText: string | null;
  customRequestBudget: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserRole = 'CUSTOMER' | 'PARTNER' | 'ADMIN';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  approvalStatus: string | null;
  isBanned: boolean | null;
  isPartnerRoot: boolean;
  isSuperAdmin: boolean;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterCustomerVerification = {
  expiresAt: string;
  verificationUrl: string;
  token: string;
};

export type RegisterCustomerResponse = {
  emailDelivery?: {
    configured: boolean;
    delivered: boolean;
    skipped: boolean;
    messageId: string | null;
  };
  verification?: RegisterCustomerVerification;
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

export type CustomerProfile = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  defaultAddress: Address | null;
  createdAt: string;
  updatedAt: string;
};

export type MeResponse = {
  id: string;
  email: string;
  role: UserRole;
  partnerProfileId: string | null;
  isPartnerRoot: boolean;
  isSuperAdmin: boolean;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  permissions?: unknown[];
  assignedPermissionKeys?: string[];
  partnerProfile?: unknown;
  adminProfile?: unknown;
  customerProfile?: CustomerProfile | null;
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

export type RegisterPartnerResponse = {
  token?: string;
  user?: { id: string; email: string };
  verification?: { sent: boolean; debugToken?: string };
};
