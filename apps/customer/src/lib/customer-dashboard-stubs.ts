// UI-only stubs for the customer dashboard. Replace with real
// GET /customer/bookings data once the backend is live.

export type StubBookingStatus =
  | 'PENDING_ASSIGNMENT'
  | 'PENDING_PARTNER'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type StubBooking = {
  id: string;
  bookingCode: string;
  serviceTypeName: string;
  partnerName: string;
  partnerInitial: string;
  status: StubBookingStatus;
  scheduledAt: string;
  city: string;
  region: string;
  pricePHP: number | null;
  notes?: string;
};

export const STUB_BOOKINGS: StubBooking[] = [
  {
    id: 'b-001',
    bookingCode: 'BK-100021',
    serviceTypeName: 'Aircon Cleaning',
    partnerName: 'CoolAir Pros',
    partnerInitial: 'C',
    status: 'ACCEPTED',
    scheduledAt: '2026-05-15T03:00:00.000Z',
    city: 'Cebu City',
    region: 'Cebu',
    pricePHP: 650,
    notes: 'Two split units in the living room and master bedroom.',
  },
  {
    id: 'b-002',
    bookingCode: 'BK-100022',
    serviceTypeName: 'Condo Cleaning',
    partnerName: 'Clean Quarters PH',
    partnerInitial: 'Q',
    status: 'PENDING_PARTNER',
    scheduledAt: '2026-05-17T06:30:00.000Z',
    city: 'Mandaue',
    region: 'Cebu',
    pricePHP: 1200,
  },
  {
    id: 'b-003',
    bookingCode: 'BK-100023',
    serviceTypeName: 'Carwash',
    partnerName: 'Bright Shine Carwash',
    partnerInitial: 'B',
    status: 'IN_PROGRESS',
    scheduledAt: '2026-05-13T08:00:00.000Z',
    city: 'Cebu City',
    region: 'Cebu',
    pricePHP: 350,
  },
  {
    id: 'b-100',
    bookingCode: 'BK-100019',
    serviceTypeName: 'Laundry',
    partnerName: 'Fresh & Fold Laundry',
    partnerInitial: 'F',
    status: 'COMPLETED',
    scheduledAt: '2026-05-02T05:00:00.000Z',
    city: 'Talisay',
    region: 'Cebu',
    pricePHP: 540,
  },
  {
    id: 'b-101',
    bookingCode: 'BK-100015',
    serviceTypeName: 'Aircon Cleaning',
    partnerName: 'CoolAir Pros',
    partnerInitial: 'C',
    status: 'COMPLETED',
    scheduledAt: '2026-04-22T01:30:00.000Z',
    city: 'Cebu City',
    region: 'Cebu',
    pricePHP: 1300,
  },
  {
    id: 'b-102',
    bookingCode: 'BK-100008',
    serviceTypeName: 'Carwash',
    partnerName: 'Bright Shine Carwash',
    partnerInitial: 'B',
    status: 'CANCELLED',
    scheduledAt: '2026-04-09T02:00:00.000Z',
    city: 'Cebu City',
    region: 'Cebu',
    pricePHP: null,
    notes: 'Cancelled — rescheduled to a later date.',
  },
];

export function isUpcomingStatus(status: StubBookingStatus): boolean {
  return (
    status === 'PENDING_ASSIGNMENT' ||
    status === 'PENDING_PARTNER' ||
    status === 'ACCEPTED' ||
    status === 'IN_PROGRESS'
  );
}
