import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search } from 'lucide-react';
import { api } from '@/lib/api';
import type { CoverageCity, CoverageRegion } from '@/types/api';
import { SearchableSelect } from '@/components/SearchableSelect';
import { DateTimePicker } from '@/components/DateTimePicker';

type SearchFormProps = {
  serviceId: string | null;
};

export function SearchForm({ serviceId }: SearchFormProps) {
  const navigate = useNavigate();
  const [region, setRegion] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [datetime, setDatetime] = useState<Date | null>(null);

  const regionsQuery = useQuery({
    queryKey: ['meta', 'coverage-regions'],
    queryFn: () => api.getRaw<CoverageRegion[]>('/json/regions.json'),
    staleTime: 60 * 60 * 1000,
  });
  const citiesQuery = useQuery({
    queryKey: ['meta', 'coverage-cities'],
    queryFn: () => api.getRaw<CoverageCity[]>('/json/cities.json'),
    staleTime: 60 * 60 * 1000,
  });

  const regionOptions = useMemo(
    () =>
      (regionsQuery.data ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [regionsQuery.data]
  );

  const cityOptions = useMemo(() => {
    const all = citiesQuery.data ?? [];
    const scoped = region
      ? all.filter((c) => String(c.coverageRegionId) === region)
      : all;
    return scoped.map((c) => ({ value: String(c.id), label: c.name }));
  }, [citiesQuery.data, region]);

  const cityPlaceholder = region
    ? 'Select city or town'
    : 'Choose a region first';

  const canSearch = !!serviceId && !!region && !!city && !!datetime;

  const handleSearch = () => {
    if (!canSearch) return;
    const params = new URLSearchParams();
    params.set('serviceTypeId', String(serviceId));
    params.set('regionId', String(region));
    params.set('cityId', String(city));
    if (datetime) params.set('at', datetime.toISOString());
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.2fr_auto] gap-1 p-2">
      <SearchableSelect
        label="Region"
        placeholder={
          regionsQuery.isPending ? 'Loading regions…' : 'Select region'
        }
        icon={
          <span
            className="text-base leading-none grayscale opacity-80"
            aria-hidden="true"
          >
            🇵🇭
          </span>
        }
        options={regionOptions}
        value={region}
        onChange={(v) => {
          setRegion(v);
          setCity(null);
        }}
        emptyText={
          regionsQuery.isPending ? 'Loading regions…' : 'No regions available.'
        }
      />

      <div className="md:border-l md:border-border">
        <SearchableSelect
          label="City / Town"
          placeholder={cityPlaceholder}
          icon={<MapPin className="size-4" />}
          options={cityOptions}
          value={city}
          onChange={setCity}
          emptyText={
            !region
              ? 'Choose a region first.'
              : citiesQuery.isPending
              ? 'Loading cities…'
              : 'No cities in this region.'
          }
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
        disabled={!canSearch}
        className="md:ml-1 inline-flex items-center justify-center gap-2 h-full min-h-14 px-7 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-95 active:opacity-90 transition-opacity shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Search className="size-5" />
        Search
      </button>
    </div>
  );
}
