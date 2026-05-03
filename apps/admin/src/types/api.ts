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

export type BusinessType = {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type PartnerBusinessType = {
  partnerId: string;
  businessTypeId: string;
  createdAt: string;
  businessType: BusinessType;
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

export type Partner = {
  id: string;
  businessName: string;
  phone: string;
  approvalStatus: ApprovalStatus;
  approvalComment: string | null;
  approvedAt: string | null;
  createdAt: string;
  user: EmbeddedUser;
  businessTypes: PartnerBusinessType[];
  documents: PartnerDocument[];
  shopLocations: PartnerShopLocation[];
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

export type ListResponse<T> = { data: T[] };
