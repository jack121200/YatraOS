import { useEffect, useState } from "react";

export interface CityEntry {
  id: string;
  name: string;
  country: string;
  currency: string;
  demo_ready: boolean;
}

// Was previously fetched independently in TripBuilder, RecoveryPicker, and
// VendorView with three separately-typed copies of CityEntry — a change to
// cities.json's shape would have had to be caught in three places. One hook.
export function useCities() {
  const [cities, setCities] = useState<CityEntry[]>([]);

  useEffect(() => {
    fetch("/demo-data/cities.json")
      .then((r) => r.json())
      .then((d) => setCities(d.cities.filter((c: CityEntry) => c.demo_ready)))
      .catch(() => setCities([]));
  }, []);

  return cities;
}
