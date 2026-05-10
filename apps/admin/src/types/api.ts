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
  approvalStatus: ApprovalStatus;
  approvalComment: string | null;
  approvedAt: string | null;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  users: PartnerUser[];
  serviceTypes: PartnerServiceType[];
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

export type BookingServiceType = 'MOBILE_CARWASH' | 'FUTURE_SERVICE';

export type BookingStatus =
  | 'PENDING_ASSIGNMENT'
  | 'AWAITING_PARTNER_APPROVAL'
  | 'PARTNER_APPROVED'
  | 'RELEASED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type MobileCarWashDetails = {
  vehicleType: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  plateNumber?: string | null;
  washPackage: string;
  addOns?: string[];
  interiorCleaning?: boolean;
  engineDetailing?: boolean;
  waterSourceAvailable?: boolean;
  powerOutletAvailable?: boolean;
  parkingNotes?: string | null;
  dirtLevel?: string | null;
  specialInstructions?: string | null;
};

export type BookingStatusLog = {
  id: string;
  bookingId: string;
  status: BookingStatus;
  comment: string | null;
  createdAt: string;
};

export type Booking = {
  id: string;
  serviceType: BookingServiceType;
  status: BookingStatus;
  scheduledAt: string;
  serviceAddress: Address;
  price: string;
  discountPrice: string | null;
  currency: string;
  notes: string | null;
  releaseComment: string | null;
  releasedAt: string | null;
  customer: Customer;
  partner: Partner | null;
  mobileCarWashDetails: MobileCarWashDetails | null;
  statusLogs: BookingStatusLog[];
  createdAt: string;
};

