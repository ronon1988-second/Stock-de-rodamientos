
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, Info, ShoppingCart, FileDown, CheckCircle } from "lucide-react";
import { getAIReorderRecommendations } from "@/app/actions";
import type { InventoryItem, MachineAssignment } from "@/lib/types";
import { ReorderRecommendationsOutput } from "@/ai/flows/reorder-recommendations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type ToBuyViewProps = {
  inventory: InventoryItem[];
  machineAssignments: MachineAssignment[];
};

type ReorderInfo = {
    item: InventoryItem;
    totalRequired: number;
    toBuy: number;
}

export default function ToBuyView({ inventory, machineAssignments }: ToBuyViewProps) {
  const [recommendations, setRecommendations] =
    useState<ReorderRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const leadTime = 7;

  const itemsToReorder: ReorderInfo[] = useMemo(() => {
    const requiredByItem: { [itemId: string]: number } = {};
    machineAssignments.forEach(item => {
        if (!requiredByItem[item.itemId]) {
            requiredByItem[item.itemId] = 0;
        }
        requiredByItem[item.itemId] += item.quantity;
    });

    const result: ReorderInfo[] = [];

    inventory.forEach(item => {
        const totalRequired = requiredByItem[item.id] || 0;
        const safetyStock = item.threshold;
        const totalDemand = totalRequired + safetyStock;
        const toBuy = totalDemand - item.stock;

        if (toBuy > 0) {
            result.push({
                item,
                totalRequired,
                toBuy,
            });
        }
    });

    return result.sort((a,b) => a.item.name.localeCompare(b.item.name));
  }, [inventory, machineAssignments]);

  const handleGetAIRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);
    
    const reorderThreshold = 2;

    const input = {
      bearingTypes: inventory.map((b) => b.name),
      historicalUsageData: "N/A", 
      currentStockLevels: JSON.stringify(
        inventory.map((b) => ({
          bearing: b.name,
          stock: b.stock,
        }))
      ),
      reorderThreshold: reorderThreshold,
      leadTimeDays: leadTime,
    };

    const result = await getAIReorderRecommendations(input);
    if (result.success && result.data) {
      setRecommendations(result.data);
      toast({
        title: "Sugerencias de IA Recibidas",
        description: "Se han calculado las cantidades óptimas para reponer.",
      });
    } else {
      setError(result.error || "Ocurrió un error desconocido.");
    }

    setIsLoading(false);
  };
  
  const getAIRecommendationFor = (itemName: string) => {
    if (!recommendations) return null;
    const rec = recommendations.recommendations.find(r => r.bearingType === itemName);
    return rec ? rec.quantityToReorder : null;
  }
  
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Artículo,Stock Actual,Total Requerido en Máquinas,Stock de Seguridad,Cantidad a Comprar (Calculado),Cantidad a Comprar (IA)\n";
    
    itemsToReorder.forEach(item => {
      const { item: inventoryItem, totalRequired, toBuy } = item;
      const aiQty = getAIRecommendationFor(inventoryItem.name) ?? "";
      csvContent += `${inventoryItem.name},${inventoryItem.stock},${totalRequired},${inventoryItem.threshold},${toBuy},${aiQty}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orden_de_compra_articulos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <Card>
        <CardHeader className="flex-row justify-between items-start gap-4">
            <div>
                <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="text-primary" />
                Lista de Artículos para Comprar
                </CardTitle>
                <CardDescription>
                  Estos artículos se calculan en función de la demanda total de las máquinas más un stock de seguridad.
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={handleGetAIRecommendations}
                    disabled={isLoading || itemsToReorder.length === 0}
                >
                    {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    )}
                    Sugerencias de IA
                </Button>
                 <Button 
                    onClick={exportToCSV}
                    disabled={itemsToReorder.length === 0}
                    variant="outline"
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Error de IA</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artículo</TableHead>
                <TableHead className="text-right">Stock Actual</TableHead>
                <TableHead className="text-right">Requerido (Máquinas)</TableHead>
                <TableHead className="text-right">Stock de Seguridad</TableHead>
                <TableHead className="text-right font-bold text-primary">Cantidad a Comprar</TableHead>
                <TableHead className="text-right font-bold">Sugerencia IA</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {itemsToReorder.length > 0 ? (
                itemsToReorder.map((item) => {
                    const { item: inventoryItem, totalRequired, toBuy } = item;
                    const aiRecommendation = getAIRecommendationFor(inventoryItem.name);
                    return (
                    <TableRow key={inventoryItem.id} className="bg-amber-500/5">
                        <TableCell className="font-medium">{inventoryItem.name}</TableCell>
                        <TableCell className="text-right text-destructive font-semibold">{inventoryItem.stock}</TableCell>
                        <TableCell className="text-right">{totalRequired}</TableCell>
                        <TableCell className="text-right">{inventoryItem.threshold}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{toBuy}</TableCell>
                        <TableCell className="text-right font-bold">
                            {aiRecommendation !== null ? (
                                <div className="flex items-center justify-end gap-2">
                                    <BrainCircuit size={16} className="text-blue-500" />
                                    <span>{aiRecommendation}</span>
                                </div>
                            ) : recommendations ? '-' : ''}
                        </TableCell>
                    </TableRow>
                )})
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <CheckCircle className="h-10 w-10 text-green-500"/>
                          <p className="text-lg font-semibold">¡Todo en orden!</p>
                          <p className="text-sm">No hay artículos que necesiten reposición en este momento.</p>
                      </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {recommendations && (
        <CardFooter>
            <Alert>
                <BrainCircuit className="h-4 w-4" />
                <AlertTitle>Recomendación Total de la IA</AlertTitle>
                <AlertDescription>
                    El valor total estimado para la reposición sugerida por la IA es de <strong>${recommendations.totalValue.toLocaleString()}</strong> (asumiendo $10 por unidad).
                </AlertDescription>
            </Alert>
        </CardFooter>
        )}
      </Card>
    </div>
  );
}
