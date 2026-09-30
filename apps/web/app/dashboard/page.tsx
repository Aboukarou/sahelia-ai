import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Tableau de bord",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <Dashboard />;
}
