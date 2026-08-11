import { getCenters } from "@/lib/api";
import { CenterCard } from "@/components/centers/CenterCard";
import { CentersMap } from "@/components/centers/CentersMap";
import { buildMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Find a Training Center",
  description:
    "Find an authorized CompuTrain center in your city. 500+ centers across India offering computer and vocational courses.",
  path: "/centers",
});

interface CentersPageProps {
  searchParams: Promise<{ state?: string; city?: string; q?: string }>;
}

export default async function CentersPage({ searchParams }: CentersPageProps) {
  const params = await searchParams;
  const centers = await getCenters({
    state: params.state,
    city: params.city,
  });

  const filtered = params.q
    ? centers.filter(
        (c) =>
          c.name.toLowerCase().includes(params.q!.toLowerCase()) ||
          c.city.toLowerCase().includes(params.q!.toLowerCase()) ||
          c.state.toLowerCase().includes(params.q!.toLowerCase())
      )
    : centers;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Find a Training Center
        </h1>
        <p className="mt-2 text-gray-600">
          500+ authorized centers across India
        </p>
      </div>

      {/* Search */}
      <form method="GET" className="mb-6 flex gap-2">
        <input
          name="q"
          defaultValue={params.q}
          type="search"
          placeholder="Search by city, district or state..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      <CentersMap />

      <div className="mt-8">
        {filtered.length === 0 ? (
          <p className="text-gray-500">No centers found for your search.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((center) => (
              <CenterCard key={center.id} center={center} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
