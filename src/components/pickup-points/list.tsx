"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { cn } from "Lib/utils";

const Map = dynamic(() => import("Components/pickup-points/map"), {
  ssr: false,
});

type Station = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type ListProps = {
  stations: Station[];
  addressLabel: string;
  initialStationId?: string;
};

export function List({ stations, addressLabel, initialStationId }: ListProps) {
  const [selectedId, setSelectedId] = useState(
    stations.some((station) => station.id === initialStationId)
      ? initialStationId
      : stations[0].id,
  );
  const selected = stations.find((station) => station.id === selectedId) ?? stations[0];

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.55fr)]">
      <ul className="flex flex-col gap-2">
        {stations.map((station) => {
          const isSelected = station.id === selected.id;

          return (
            <li key={station.id}>
              <button
                type="button"
                onClick={() => setSelectedId(station.id)}
                aria-pressed={isSelected}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted",
                )}
              >
                <div className="text-sm font-medium">{station.name}</div>
                <div className="text-[13px] text-muted-foreground">{station.address}</div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="overflow-hidden rounded-2xl border">
        <div className="border-b bg-muted/40 px-4 py-3">
          <div className="text-sm font-medium">{selected.name}</div>
          <div className="text-[13px] text-muted-foreground">
            {addressLabel}: {selected.address}
          </div>
        </div>

        <div className="aspect-16/10 w-full">
          <Map
            latitude={selected.latitude}
            longitude={selected.longitude}
            name={selected.name}
            address={selected.address}
          />
        </div>
      </div>
    </div>
  );
}
