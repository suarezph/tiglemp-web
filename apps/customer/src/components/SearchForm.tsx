import { useEffect, useMemo, useState } from 'react';
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

  // Auto-progress: bump these counters when the previous step is filled so
  // the next picker opens automatically (Skyscanner / DOHOP-style flow).
  const [citySignal, setCitySignal] = useState(0);
  const [scheduleSignal, setScheduleSignal] = useState(0);

  // When the customer switches services in the hero tabs, the region/city
  // they had picked may no longer be served. Clear them so the next pick
  // starts from a clean slate.
  useEffect(() => {
    setRegion(null);
    setCity(null);
  }, [serviceId]);

  const regionsQuery = useQuery({
    queryKey: ['meta', 'available-regions', serviceId],
    queryFn: () =>
      api.get<CoverageRegion[]>(
        `/meta/available-regions?serviceTypeId=${encodeURIComponent(serviceId!)}`
      ),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000,
  });
  const citiesQuery = useQuery({
    queryKey: ['meta', 'available-cities', serviceId, region],
    queryFn: () =>
      api.get<CoverageCity[]>(
        `/meta/available-cities?serviceTypeId=${encodeURIComponent(
          serviceId!
        )}&regionId=${encodeURIComponent(region!)}`
      ),
    enabled: !!serviceId && !!region,
    staleTime: 5 * 60 * 1000,
  });

  const regionOptions = useMemo(
    () =>
      (regionsQuery.data?.data ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [regionsQuery.data]
  );

  const cityOptions = useMemo(
    () =>
      (citiesQuery.data?.data ?? []).map((c) => ({
        value: String(c.id),
        label: c.name,
      })),
    [citiesQuery.data]
  );

  const regionPlaceholder = !serviceId
    ? 'Pick a service first'
    : regionsQuery.isPending
    ? 'Loading regions…'
    : regionOptions.length === 0
    ? 'No regions available'
    : 'Pick a region';

  const cityPlaceholder = !region
    ? 'Pick a region first'
    : citiesQuery.isPending
    ? 'Loading cities…'
    : cityOptions.length === 0
    ? 'No cities available'
    : 'Pick a city or town';

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
        label="Where to?"
        placeholder={regionPlaceholder}
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
          setCitySignal((n) => n + 1);
        }}
        emptyText={
          !serviceId
            ? 'Pick a service first.'
            : regionsQuery.isPending
            ? 'Loading regions…'
            : 'No partners serving that service yet.'
        }
      />

      <div className="md:border-l md:border-border">
        <SearchableSelect
          label="Where exactly?"
          placeholder={cityPlaceholder}
          icon={<MapPin className="size-4" />}
          options={cityOptions}
          value={city}
          onChange={(v) => {
            setCity(v);
            setScheduleSignal((n) => n + 1);
          }}
          openSignal={citySignal}
          emptyText={
            !region
              ? 'Pick a region first.'
              : citiesQuery.isPending
              ? 'Loading cities…'
              : 'No cities in this region.'
          }
        />
      </div>

      <div className="md:border-l md:border-border">
        <DateTimePicker
          label="When?"
          placeholder="Pick a date & time"
          value={datetime}
          onChange={setDatetime}
          openSignal={scheduleSignal}
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
