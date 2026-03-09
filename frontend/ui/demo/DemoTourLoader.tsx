"use client";

import dynamic from "next/dynamic";

const DemoTour = dynamic(() => import("./DemoTour"), {
  ssr: false,
  loading: () => null,
});

export default function DemoTourLoader() {
  return <DemoTour />;
}
