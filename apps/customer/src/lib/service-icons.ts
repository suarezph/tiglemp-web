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
  Sun,
  Trash2,
  Trees,
  Truck,
  Waves,
  type LucideIcon,
} from 'lucide-react';

// Map a backend service `code` (e.g. "aircon_cleaning") to a Lucide icon.
// Falls back to a keyword scan, then a generic Sparkles glyph.
const EXACT: Record<string, LucideIcon> = {
  aircon_cleaning: Snowflake,
  apartment_cleaning: LampDesk,
  airbnb_rental_turnover_cleaning: Truck,
  carwash: Car,
  car_wash: Car,
  carpet_cleaning: Square,
  condo_cleaning: LampDesk,
  disinfection: Droplets,
  dry_cleaning: SprayCan,
  garden_cleaning: Trees,
  house_cleaning: Home,
  laundry: Shirt,
  mattress_cleaning: BedDouble,
  mobile_carwash: Car,
  move_in_out: Truck,
  move_in_out_cleaning: Truck,
  office_cleaning: Sparkles,
  pest_control: Bug,
  pool_cleaning: Waves,
  post_construction_cleaning: Hammer,
  post_renovation_cleaning: Hammer,
  rubbish_hauling: Trash2,
  sofa_cleaning: Sofa,
  solar_panel_cleaning: Sun,
  storage_cleaning: Package,
  window_cleaning: Flame,
};

const KEYWORD_FALLBACK: Array<[RegExp, LucideIcon]> = [
  [/carwash|car_wash/, Car],
  [/aircon|airconditioner/, Snowflake],
  [/pool/, Waves],
  [/laundry/, Shirt],
  [/dry[_\s-]?clean/, SprayCan],
  [/mattress/, BedDouble],
  [/sofa|couch/, Sofa],
  [/carpet|rug/, Square],
  [/pest/, Bug],
  [/disinfect/, Droplets],
  [/window/, Flame],
  [/garden|yard|lawn/, Trees],
  [/construction|renovat/, Hammer],
  [/airbnb|rental|turnover|move/, Truck],
  [/rubbish|junk|haul|waste/, Trash2],
  [/solar/, Sun],
  [/storage|stockroom|bodega/, Package],
  [/condo|apartment|studio/, LampDesk],
  [/office|workspace|commercial/, Sparkles],
  [/house|home|residential/, Home],
];

export function getServiceIcon(code: string | null | undefined): LucideIcon {
  if (!code) return Sparkles;
  const key = code.toLowerCase();
  const exact = EXACT[key];
  if (exact) return exact;
  for (const [re, icon] of KEYWORD_FALLBACK) {
    if (re.test(key)) return icon;
  }
  return Sparkles;
}
