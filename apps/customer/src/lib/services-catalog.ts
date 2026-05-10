// Placeholder service catalog for the hero search tabs and the marketing
// services grid. This will be replaced with a dynamic API list when the
// backend exposes one. Order is rough popularity for the marketplace.

import {
  BedDouble,
  Bug,
  Car,
  Droplets,
  Flame,
  Hammer,
  Home,
  LampDesk,
  Package,
  Shirt,
  Sofa,
  Snowflake,
  Sparkles,
  SprayCan,
  Square,
  Trash2,
  Trees,
  Truck,
  Waves,
} from 'lucide-react';

export type ServiceItem = {
  id: string;
  label: string;
  description: string;
  icon: typeof Car;
};

export const SERVICES: ServiceItem[] = [
  {
    id: 'carwash',
    label: 'Carwash',
    description:
      'Exterior + interior wash — at the shop or right at your driveway.',
    icon: Car,
  },
  {
    id: 'house-cleaning',
    label: 'House Cleaning',
    description: 'Top-to-bottom cleaning for every room of your home.',
    icon: Home,
  },
  {
    id: 'condo-cleaning',
    label: 'Condo Cleaning',
    description: 'Tailored cleaning packages for studio and unit living.',
    icon: LampDesk,
  },
  {
    id: 'office-cleaning',
    label: 'Office Cleaning',
    description: 'Keep your workplace fresh and tidy, daily or one-off.',
    icon: Sparkles,
  },
  {
    id: 'laundry',
    label: 'Laundry',
    description: 'Wash, dry, and fold — pickup and drop-off available.',
    icon: Shirt,
  },
  {
    id: 'dry-cleaning',
    label: 'Dry Cleaning',
    description: 'Suits, gowns, and delicates handled by trusted pros.',
    icon: SprayCan,
  },
  {
    id: 'aircon-cleaning',
    label: 'Aircon Cleaning',
    description: 'Deep clean and tune-up for cooler, healthier air at home.',
    icon: Snowflake,
  },
  {
    id: 'sofa-cleaning',
    label: 'Sofa Cleaning',
    description: 'Stain removal and full shampoo treatment for any couch.',
    icon: Sofa,
  },
  {
    id: 'mattress-cleaning',
    label: 'Mattress Cleaning',
    description: 'Sanitize, vacuum, and freshen up where you sleep best.',
    icon: BedDouble,
  },
  {
    id: 'carpet-cleaning',
    label: 'Carpet Cleaning',
    description: 'Deep extraction and stain treatment for rugs and carpets.',
    icon: Square,
  },
  {
    id: 'pest-control',
    label: 'Pest Control',
    description: 'Roaches, ants, rats, mosquitoes — handled by licensed pros.',
    icon: Bug,
  },
  {
    id: 'disinfection',
    label: 'Disinfection',
    description: 'Hospital-grade sanitizing fog for homes, offices, vehicles.',
    icon: Droplets,
  },
  {
    id: 'pool-cleaning',
    label: 'Pool Cleaning',
    description: 'Skim, vacuum, and chemical balance — pool-ready in hours.',
    icon: Waves,
  },
  {
    id: 'window-cleaning',
    label: 'Window Cleaning',
    description: 'Streak-free clarity for high-rise or ground-level windows.',
    icon: Flame,
  },
  {
    id: 'post-construction',
    label: 'Post-Construction',
    description: 'Dust-out and detailed clean after build or renovation work.',
    icon: Hammer,
  },
  {
    id: 'move-in-out',
    label: 'Move-in / Move-out',
    description: 'Spotless turnover before keys swap or after you move out.',
    icon: Truck,
  },
  {
    id: 'garden-cleaning',
    label: 'Garden Cleaning',
    description: 'Trim, weed, and tidy your outdoor space and front yard.',
    icon: Trees,
  },
  {
    id: 'rubbish-hauling',
    label: 'Rubbish Hauling',
    description: 'Bulk waste pickup and proper disposal — no junk left behind.',
    icon: Trash2,
  },
  {
    id: 'storage-cleaning',
    label: 'Storage Cleaning',
    description: 'Declutter and sanitize storerooms, bodegas, and basements.',
    icon: Package,
  },
];
