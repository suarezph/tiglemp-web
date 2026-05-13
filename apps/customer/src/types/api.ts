export type ServiceType = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
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
