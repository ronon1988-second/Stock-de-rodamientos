"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Package, ShoppingCart, Truck } from "lucide-react";
import StockTable from "./stock-table";
import type { Bearing, Sector } from "@/lib/types";

type DashboardProps = {
  bearings: Bearing[];
  onLogUsage: (bearingId: string, quantity: number, sector: Sector) => void;
  onUpdateBearing: (bearing: Bearing) => void;
};

export default function Dashboard({
  bearings,
  onLogUsage,
  onUpdateBearing,
}: DashboardProps) {
  const totalStock = bearings.reduce((sum, b) => sum + b.stock, 0);
  const lowStockCount = bearings.filter((b) => b.stock < b.threshold).length;
  const outOfStockCount = bearings.filter((b) => b.stock === 0).length;

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground">Unidades totales en inventario</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Rodamiento</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bearings.length}</div>
             <p className="text-xs text-muted-foreground">Códigos únicos gestionados</p>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "border-amber-500/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Necesitan Reposición</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-amber-500" : ""}`}>
              {lowStockCount}
            </div>
             <p className="text-xs text-muted-foreground">Artículos bajo el umbral</p>
          </CardContent>
        </Card>
        <Card className={outOfStockCount > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className={`text-2xl font-bold ${outOfStockCount > 0 ? "text-destructive" : ""}`}>
              {outOfStockCount}
            </div>
            <p className="text-xs text-muted-foreground">Artículos con stock cero</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8">
          <StockTable 
            bearings={bearings} 
            onLogUsage={onLogUsage}
            onUpdateBearing={onUpdateBearing}
          />
      </div>
    </div>
  );
}
