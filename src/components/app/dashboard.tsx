
"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Package, ShoppingCart, Truck } from "lucide-react";
import StockTable from "./stock-table";
import type { InventoryItem, MachinesBySector, Sector } from "@/lib/types";

type DashboardProps = {
  inventory: InventoryItem[];
  onUpdateItem: (item: InventoryItem) => void;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onLogUsage: (itemId: string, quantity: number, machineId: string | null, sectorId: string | null) => void;
  canEdit: boolean;
  sectors: Sector[];
  machinesBySector: MachinesBySector;
};

export default function Dashboard({
  inventory,
  onUpdateItem,
  onAddItem,
  onLogUsage,
  canEdit,
  sectors,
  machinesBySector,
}: DashboardProps) {
  const totalStock = inventory.reduce((sum, b) => sum + b.stock, 0);
  const lowStockCount = inventory.filter((b) => b.stock < b.threshold).length;
  const outOfStockCount = inventory.filter((b) => b.stock === 0).length;

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground">Unidades totales en inventario</p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">Tipos de Artículo</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{inventory.length}</div>
             <p className="text-xs text-muted-foreground">Códigos únicos gestionados</p>
          </CardContent>
        </Card>
        <Card className={`border-2 ${lowStockCount > 0 ? "border-amber-500/50" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">Necesitan Reposición</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-amber-500" : ""}`}>
              {lowStockCount}
            </div>
             <p className="text-xs text-muted-foreground">Artículos bajo el umbral</p>
          </CardContent>
        </Card>
        <Card className={`border-2 ${outOfStockCount > 0 ? "border-destructive/50" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
             <div className={`text-2xl font-bold ${outOfStockCount > 0 ? "text-destructive" : ""}`}>
              {outOfStockCount}
            </div>
            <p className="text-xs text-muted-foreground">Artículos con stock cero</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8">
          <StockTable 
            inventory={inventory} 
            onUpdateItem={onUpdateItem}
            onAddItem={onAddItem}
            onLogUsage={onLogUsage}
            canEdit={canEdit}
            sectors={sectors}
            machinesBySector={machinesBySector}
          />
      </div>
    </div>
  );
}

    

    