"use client";

import { useMemo, useState } from "react";
import { KpiCard } from "./kpi-card";

type DashboardKpi = Parameters<typeof KpiCard>[0]["kpi"];

type CategoryFilterProps = {
  kpis: DashboardKpi[];
};

export function CategoryFilter({ kpis }: CategoryFilterProps) {
  const categories = useMemo(() => ["All", ...new Set(kpis.map((kpi) => kpi.category))], [kpis]);
  const [activeCategory, setActiveCategory] = useState("All");
  const visibleKpis =
    activeCategory === "All" ? kpis : kpis.filter((kpi) => kpi.category === activeCategory);

  return (
    <section className="flex flex-col gap-md" aria-labelledby="kpi-list-heading">
      <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
        <h2 id="kpi-list-heading" className="text-xl font-semibold">
          KPI catalogue
        </h2>
        <div className="segmented-control" role="group" aria-label="Filter KPIs by category">
          {categories.map((category) => (
            <button
              aria-pressed={activeCategory === category}
              className="segmented-control-item"
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
        {visibleKpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </section>
  );
}
