export type UserRole = 'ADMIN' | 'PARTNER' | 'CUSTOMER';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  approvalStatus?: ApprovalStatus;
  isBanned?: boolean;
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
  userId: string;
  businessName: string;
  phone: string;
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
  documents: PartnerDocument[];
  shopLocations: PartnerShopLocation[];
  approvalLogs: ApprovalLog[];
};

