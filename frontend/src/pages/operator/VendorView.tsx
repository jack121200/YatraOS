import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { formatMoney } from "../../lib/money";
import { useCities } from "../../lib/useCities";

interface Place {
  id: string;
  name: string;
  category: string;
  avg_cost: number;
  opening_hours: string;
}

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="h-4 w-36 rounded bg-surface-1" />
          <div className="h-4 w-16 rounded bg-surface-1" />
          <div className="h-4 w-20 rounded bg-surface-1" />
          <div className="h-4 w-28 rounded bg-surface-1" />
        </div>
      ))}
    </div>
  );
}

// Read-only by design (roadmap: full vendor auth is a WON'T HAVE for the
// hackathon). Stays + eateries double as "vendors" here since there's no
// separate vendor table yet.
export default function VendorView() {
  const cities = useCities();
  const [cityId, setCityId] = useState("jaipur");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ places: Place[] }>("/api/demo/places", { params: { city: cityId } })
      .then(({ data }) => setPlaces(data.places.filter((p) => p.category === "stay" || p.category === "eatery")))
      .catch(() => setPlaces([]))
      .finally(() => setLoading(false));
  }, [cityId]);

  const currency = cities.find((c) => c.id === cityId)?.currency ?? "INR";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-polar">Vendors</h1>
        <span className="rounded-full bg-surface-1 px-2.5 py-1 text-xs font-semibold text-slate">Read-only</span>
      </div>

      <select
        value={cityId}
        onChange={(e) => setCityId(e.target.value)}
        className="mb-6 min-h-11 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-polar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
      >
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}, {c.country}
          </option>
        ))}
      </select>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-2">
        {loading ? (
          <TableSkeleton />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-slate">
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Hours</th>
              </tr>
            </thead>
            <tbody>
              {places.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-polar">{p.name}</td>
                  <td className="px-4 py-3 capitalize text-slate">{p.category}</td>
                  <td className="px-4 py-3 tabular-nums text-polar">{formatMoney(p.avg_cost, currency)}</td>
                  <td className="px-4 py-3 text-slate">{p.opening_hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
