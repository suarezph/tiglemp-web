export type ServiceType = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
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
