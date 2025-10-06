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
import type { Bearing, SectorInventory } from "@/lib/types";
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
  bearings: Bearing[];
  sectorInventory: SectorInventory[];
};

type ReorderInfo = {
    bearing: Bearing;
    totalRequired: number;
    toBuy: number;
}

export default function ToBuyView({ bearings, sectorInventory }: ToBuyViewProps) {
  const [recommendations, setRecommendations] =
    useState<ReorderRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const leadTime = 7;

  const bearingsToReorder: ReorderInfo[] = useMemo(() => {
    const requiredBySector: { [bearingId: string]: number } = {};
    sectorInventory.forEach(item => {
        if (!requiredBySector[item.bearingId]) {
            requiredBySector[item.bearingId] = 0;
        }
        requiredBySector[item.bearingId] += item.quantity;
    });

    const result: ReorderInfo[] = [];

    bearings.forEach(bearing => {
        const totalRequired = requiredBySector[bearing.id] || 0;
        const safetyStock = bearing.threshold; // Now 2 for all
        const totalDemand = totalRequired + safetyStock;
        const toBuy = totalDemand - bearing.stock;

        if (toBuy > 0) {
            result.push({
                bearing,
                totalRequired,
                toBuy,
            });
        }
    });

    return result.sort((a,b) => a.bearing.name.localeCompare(b.bearing.name));
  }, [bearings, sectorInventory]);

  const handleGetAIRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);
    
    // The AI prompt needs a threshold, let's use the safety stock value.
    const reorderThreshold = 2;

    const input = {
      bearingTypes: bearings.map((b) => b.name),
      historicalUsageData: "N/A", // Simplified for this view
      currentStockLevels: JSON.stringify(
        bearings.map((b) => ({
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
  
  const getAIRecommendationFor = (bearingName: string) => {
    if (!recommendations) return null;
    const rec = recommendations.recommendations.find(r => r.bearingType === bearingName);
    return rec ? rec.quantityToReorder : null;
  }
  
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Rodamiento,Stock Actual,Total Requerido en Sectores,Stock de Seguridad,Cantidad a Comprar (Calculado),Cantidad a Comprar (IA)\n";
    
    bearingsToReorder.forEach(item => {
      const { bearing, totalRequired, toBuy } = item;
      const aiQty = getAIRecommendationFor(bearing.name) ?? "";
      csvContent += `${bearing.name},${bearing.stock},${totalRequired},${bearing.threshold},${toBuy},${aiQty}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orden_de_compra_rodamientos.csv");
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
                Lista de Rodamientos para Comprar
                </CardTitle>
                <CardDescription>
                  Estos artículos se calculan en función de la demanda total de los sectores más un stock de seguridad.
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={handleGetAIRecommendations}
                    disabled={isLoading || bearingsToReorder.length === 0}
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
                    disabled={bearingsToReorder.length === 0}
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
                <TableHead>Rodamiento</TableHead>
                <TableHead className="text-right">Stock Actual</TableHead>
                <TableHead className="text-right">Requerido (Sectores)</TableHead>
                <TableHead className="text-right">Stock de Seguridad</TableHead>
                <TableHead className="text-right font-bold text-primary">Cantidad a Comprar</TableHead>
                <TableHead className="text-right font-bold">Sugerencia IA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bearingsToReorder.length > 0 ? (
                bearingsToReorder.map((item) => {
                  const { bearing, totalRequired, toBuy } = item;
                  const aiRecommendation = getAIRecommendationFor(bearing.name);
                  return (
                  <TableRow key={bearing.id}>
                    <TableCell className="font-medium">{bearing.name}</TableCell>
                    <TableCell className="text-right text-destructive font-semibold">{bearing.stock}</TableCell>
                    <TableCell className="text-right">{totalRequired}</TableCell>
                    <TableCell className="text-right">{bearing.threshold}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{toBuy}</TableCell>
                    <TableCell className="text-right font-bold">
                        {aiRecommendation !== null ? (
                            <div className="flex items-center justify-end gap-2">
                                <BrainCircuit size={16} />
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
