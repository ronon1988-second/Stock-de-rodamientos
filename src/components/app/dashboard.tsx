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
  onAddBearing: (newBearing: Omit<Bearing, 'id'>) => void;
  onUpdateBearing: (bearing: Bearing) => void;
};

export default function Dashboard({
  bearings,
  usageLog,
  onLogUsage,
  onAddBearing,
  onUpdateBearing,
}: DashboardProps) {
  const totalStock = bearings.reduce((sum, b) => sum + b.stock, 0);
  const lowStockCount = bearings.filter((b) => b.stock <= b.threshold).length;
  const outOfStockCount = bearings.filter((b) => b.stock === 0).length;

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Stock Total</CardTitle>
            <CardDescription>Unidades totales de todos los rodamientos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Tipos de Rodamiento</CardTitle>
            <CardDescription>Tipos de rodamientos distintos en inventario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{bearings.length}</div>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2">
            <CardTitle>Stock Bajo</CardTitle>
            <CardDescription>Artículos por debajo del umbral</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${lowStockCount > 0 ? "text-destructive" : ""}`}>
              {lowStockCount}
            </div>
          </CardContent>
        </Card>
        <Card className={outOfStockCount > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle>Sin Stock</CardTitle>
            <CardDescription>Artículos con stock cero</CardDescription>
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
          <StockTable 
            bearings={bearings} 
            onLogUsage={onLogUsage}
            onAddBearing={onAddBearing}
            onUpdateBearing={onUpdateBearing}
          />
        </div>
        <div className="lg:col-span-2">
          <ReorderCard bearings={bearings} usageLog={usageLog} />
        </div>
      </div>
    </div>
  );
}
