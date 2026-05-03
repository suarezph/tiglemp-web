export type UserRole = 'ADMIN' | 'PARTNER' | 'CUSTOMER';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

export type BusinessType = {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type RegisterPartnerBody = {
  email: string;
  password: string;
  businessTypeIds: string[];
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
  message: string;
  token?: string;
  user?: AuthUser & { approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' };
  verification?: VerificationPayload;
};

export type ResendVerificationResponse = {
  message: string;
  verification?: VerificationPayload;
};

export type ListResponse<T> = { data: T[] };
