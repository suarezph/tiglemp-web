import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';
import { DateTimePicker } from '@/components/DateTimePicker';
import { REGIONS, CITIES } from '@/lib/locations-placeholder';

type SearchFormProps = {
  serviceId: string;
};

export function SearchForm({ serviceId }: SearchFormProps) {
  const [region, setRegion] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [datetime, setDatetime] = useState<Date | null>(null);

  const handleSearch = () => {
    // No routing yet — just emit so we can verify wiring.
    console.log('[Tiglemp Search]', {
      serviceId,
      region,
      city,
      datetime: datetime?.toISOString() ?? null,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.2fr_auto] gap-1 p-2">
      <SearchableSelect
        label="Region"
        placeholder="Select region"
        icon={
          <span
            className="text-base leading-none grayscale opacity-80"
            aria-hidden="true"
          >
            🇵🇭
          </span>
        }
        options={REGIONS}
        value={region}
        onChange={(v) => {
          setRegion(v);
          setCity(null);
        }}
      />

      <div className="md:border-l md:border-border">
        <SearchableSelect
          label="City / Town"
          placeholder="Select city or town"
          icon={<MapPin className="size-4" />}
          options={CITIES}
          value={city}
          onChange={setCity}
        />
      </div>

      <div className="md:border-l md:border-border">
        <DateTimePicker
          label="Schedule"
          placeholder="Pick a date & time"
          value={datetime}
          onChange={setDatetime}
        />
      </div>

      <button
        type="button"
        onClick={handleSearch}
        className="md:ml-1 inline-flex items-center justify-center gap-2 h-full min-h-14 px-7 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-95 active:opacity-90 transition-opacity shadow-md shadow-primary/20"
      >
        <Search className="size-5" />
        Search
      </button>
    </div>
  );
}
