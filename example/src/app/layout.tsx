import {
  NavigationBarContainer,
  NavigationBarProvider,
} from "@/components/navigation-bar";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/loader";
import { useState } from "react";
import ApplicationHeader from "./layout/header";
import { Card } from "@/components/ui/card";
import WidgetContainer from "./layout/container";
import type { WidgetData } from "./types/widget";

export default function ApplicationLayout() {
  // Simulating the array of widgets with the updated WidgetData structure
  const widgets: WidgetData[] = [
    {
      id: "w1", // Added for React key prop
      title: "Sales Overview",
      description: "Monthly sales figures and trends.",
      name: "sales-overview",
      position: { row: 1, column: 1 },
      span: { column: 4 }, // Spans 4 columns
    },
    {
      id: "w2",
      title: "New Customers",
      description: "Count of new customers this quarter.",
      name: "new-customers",
      position: { row: 1, column: 5 },
      span: { column: 2, row: 2 }, // Spans 2 columns, 2 rows
    },
    {
      id: "w3",
      title: "Revenue Chart",
      description: "Interactive chart displaying revenue over time.",
      name: "revenue-chart",
      position: { row: 1, column: 7 },
      span: { column: 6 }, // Spans 6 columns
    },
    {
      id: "w4",
      title: "Support Tickets",
      description: "Current open support tickets.",
      name: "support-tickets",
      position: { row: 2, column: 1 },
      span: { column: 4 }, // Spans 4 columns
    },
    {
      id: "w5",
      title: "Product Performance",
      description: "Top performing products by region.",
      name: "product-performance",
      position: { row: 3, column: 1 },
      span: { column: 6, row: 2 }, // Spans 6 columns, 2 rows
    },
    {
      id: "w6",
      title: "Quick Stats",
      description: "At-a-glance key metrics.",
      name: "quick-stats",
      position: { row: 3, column: 7 },
      span: { column: 3 }, // Spans 3 columns
    },
    {
      id: "w7",
      title: "Activity Log",
      description: "Recent user activity.",
      name: "activity-log",
      position: { row: 4, column: 10 },
      span: { column: 3 }, // Spans 3 columns
    },
    {
      id: "w8",
      title: "Team Updates",
      description: "Latest announcements and team news.",
      name: "team-updates",
      position: { row: 5, column: 7 },
      span: { column: 6 }, // Spans 6 columns
    },
  ];
  return (
    <NavigationBarProvider>
      <div className="w-screen h-screen flex flex-col items-center justify-center gap-2 p-2 overflow-x-hidden">
        <NavigationBarContainer className="w-full rounded border m-2 py-2 h-16" />
        <ApplicationHeader />
        <WidgetContainer widgets={widgets} />
      </div>
    </NavigationBarProvider>
  );
}
