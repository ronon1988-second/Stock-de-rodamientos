"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Package, PackageCheck } from "lucide-react";
import StockTable from "./stock-table";
import ReorderCard from "./reorder-card";
import type { Bearing, UsageLog } from "@/lib/types";

type DashboardProps = {
  bearings: Bearing[];
  usageLog: UsageLog[];
  onLogUsage: (bearingId: string, quantity: number) => void;
};

export default function Dashboard({
  bearings,
  usageLog,
  onLogUsage,
}: DashboardProps) {
  const totalStock = bearings.reduce((sum, b) => sum + b.stock, 0);
  const lowStockCount = bearings.filter((b) => b.stock <= b.threshold).length;
  const outOfStockCount = bearings.filter((b) => b.stock === 0).length;

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Stock</CardTitle>
            <CardDescription>Total units of all bearings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Bearing Types</CardTitle>
            <CardDescription>Distinct bearing types in inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{bearings.length}</div>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2">
            <CardTitle>Low Stock</CardTitle>
            <CardDescription>Items below threshold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${lowStockCount > 0 ? "text-destructive" : ""}`}>
              {lowStockCount}
            </div>
          </CardContent>
        </Card>
        <Card className={outOfStockCount > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle>Out of Stock</CardTitle>
            <CardDescription>Items with zero stock</CardDescription>
          </CardHeader>
          <CardContent>
             <div className={`text-4xl font-bold ${outOfStockCount > 0 ? "text-destructive/80" : ""}`}>
              {outOfStockCount}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <StockTable bearings={bearings} onLogUsage={onLogUsage} />
        </div>
        <div className="lg:col-span-2">
          <ReorderCard bearings={bearings} usageLog={usageLog} />
        </div>
      </div>
    </div>
  );
}
