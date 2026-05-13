export type ServiceType = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
};

export type RegisterPartnerResponse = {
  token?: string;
  user?: { id: string; email: string };
  verification?: { sent: boolean; debugToken?: string };
};
