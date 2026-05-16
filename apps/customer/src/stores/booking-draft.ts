import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ServiceFulfillmentMode } from '@/types/api';

export type BookingSearchContext = {
  serviceTypeId: string | null;
  serviceTypeName: string | null;
  serviceTypeCode: string | null;
  /** From the service type. Determines whether the wizard shows the address step. */
  serviceTypeFulfillmentMode: ServiceFulfillmentMode | null;
  serviceTypeRequiresAddress: boolean | null;
  regionId: string | null;
  regionName: string | null;
  cityId: string | null;
  cityName: string | null;
  /** ISO string. */
  scheduledAt: string | null;
};

export type BookingPartnerPick = {
  id: string;
  businessName: string;
  /** Whether this partner was auto-selected by the system. */
  autoAssigned: boolean;
};

export type BookingPackagePick = {
  id: string;
  name: string;
  priceFromPHP: number | null;
};

export type BookingCustomRequest = {
  description: string;
  budgetPHP: number | null;
};

export type BookingAddressDraft = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
};

export type BookingGuestContact = {
  fullName: string;
  email: string;
  phone: string;
};

type BookingDraftState = {
  search: BookingSearchContext;
  partner: BookingPartnerPick | null;
  package: BookingPackagePick | null;
  customRequest: BookingCustomRequest | null;
  authChoice: 'guest' | 'authed' | null;
  guestContact: BookingGuestContact | null;
  address: BookingAddressDraft | null;
  /** Optional top-level message for the partner ("Gate code is 1234", etc). */
  notes: string;
  setSearch: (next: BookingSearchContext) => void;
  setServiceMeta: (
    meta: Pick<
      BookingSearchContext,
      'serviceTypeFulfillmentMode' | 'serviceTypeRequiresAddress'
    >
  ) => void;
  setPartner: (next: BookingPartnerPick | null) => void;
  setPackage: (next: BookingPackagePick | null) => void;
  setCustomRequest: (next: BookingCustomRequest | null) => void;
  setAuthChoice: (next: 'guest' | 'authed' | null) => void;
  setGuestContact: (next: BookingGuestContact | null) => void;
  setAddress: (next: BookingAddressDraft | null) => void;
  setNotes: (next: string) => void;
  resetSelection: () => void;
  resetAll: () => void;
};

const EMPTY_SEARCH: BookingSearchContext = {
  serviceTypeId: null,
  serviceTypeName: null,
  serviceTypeCode: null,
  serviceTypeFulfillmentMode: null,
  serviceTypeRequiresAddress: null,
  regionId: null,
  regionName: null,
  cityId: null,
  cityName: null,
  scheduledAt: null,
};

export const useBookingDraft = create<BookingDraftState>()(
  persist(
    (set, get) => ({
      search: EMPTY_SEARCH,
      partner: null,
      package: null,
      customRequest: null,
      authChoice: null,
      guestContact: null,
      address: null,
      notes: '',
      setSearch: (next) =>
        set({
          search: next,
          partner: null,
          package: null,
          customRequest: null,
          authChoice: null,
          guestContact: null,
          address: null,
          notes: '',
        }),
      setServiceMeta: (meta) =>
        set({
          search: {
            ...get().search,
            serviceTypeFulfillmentMode: meta.serviceTypeFulfillmentMode,
            serviceTypeRequiresAddress: meta.serviceTypeRequiresAddress,
          },
        }),
      setPartner: (next) =>
        set({ partner: next, package: null, customRequest: null }),
      setPackage: (next) => set({ package: next, customRequest: null }),
      setCustomRequest: (next) => set({ customRequest: next, package: null }),
      setAuthChoice: (next) => set({ authChoice: next }),
      setGuestContact: (next) => set({ guestContact: next }),
      setAddress: (next) => set({ address: next }),
      setNotes: (next) => set({ notes: next }),
      resetSelection: () =>
        set({
          partner: null,
          package: null,
          customRequest: null,
          authChoice: null,
          guestContact: null,
          address: null,
          notes: '',
        }),
      resetAll: () =>
        set({
          search: EMPTY_SEARCH,
          partner: null,
          package: null,
          customRequest: null,
          authChoice: null,
          guestContact: null,
          address: null,
          notes: '',
        }),
    }),
    {
      name: 'tiglemp.booking-draft',
    }
  )
);

/**
 * Decides whether the wizard should show the Address step for the currently
 * selected service. Mirrors backend rules:
 *   ON_SITE  → required
 *   IN_SHOP  → skip
 *   BOTH     → required (per product call)
 */
export function shouldCollectAddress(
  mode: ServiceFulfillmentMode | null | undefined
): boolean {
  if (!mode) return true; // safe default while metadata is loading
  return mode !== 'IN_SHOP';
}
