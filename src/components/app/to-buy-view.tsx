"use client";

import React, { useState } from "react";
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
import type { Bearing, UsageLog } from "@/lib/types";
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
  onUpdateBearing: (bearing: Bearing) => void;
};

export default function ToBuyView({ bearings, onUpdateBearing }: ToBuyViewProps) {
  const [recommendations, setRecommendations] =
    useState<ReorderRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const reorderThreshold = 10;
  const leadTime = 7;

  const bearingsToReorder = bearings.filter(b => b.stock < b.threshold);

  const handleGetAIRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);

    const input = {
      bearingTypes: bearings.map((b) => b.name),
      historicalUsageData: "N/A", // Simplified for this view
      currentStockLevels: JSON.stringify(
        bearings.map((b) => ({
          bearing: b.name,
          stock: b.stock,
          sector: b.sector,
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
    let csvContent = "data:text/csv;charset=utf-8,Rodamiento,Stock Actual,Umbral,Cantidad a Comprar (Manual),Cantidad a Comprar (IA)\n";
    
    bearingsToReorder.forEach(b => {
      const needed = b.threshold - b.stock;
      const aiQty = getAIRecommendationFor(b.name) || "";
      csvContent += `${b.name},${b.stock},${b.threshold},${needed},${aiQty}\n`;
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
                Estos artículos están por debajo de su umbral de stock. Genera sugerencias de IA o exporta la lista.
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
                <TableHead className="text-right">Umbral</TableHead>
                <TableHead className="text-right font-bold">Cantidad a Comprar (Manual)</TableHead>
                <TableHead className="text-right font-bold text-primary">Cantidad a Comprar (IA)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bearingsToReorder.length > 0 ? (
                bearingsToReorder.map((bearing) => {
                  const needed = bearing.threshold > bearing.stock ? bearing.threshold - bearing.stock : 0;
                  const aiRecommendation = getAIRecommendationFor(bearing.name);
                  return (
                  <TableRow key={bearing.id}>
                    <TableCell className="font-medium">{bearing.name}</TableCell>
                    <TableCell className="text-right text-destructive font-semibold">{bearing.stock}</TableCell>
                    <TableCell className="text-right">{bearing.threshold}</TableCell>
                    <TableCell className="text-right font-bold">{needed}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
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
                  <TableCell colSpan={5} className="h-48 text-center">
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
