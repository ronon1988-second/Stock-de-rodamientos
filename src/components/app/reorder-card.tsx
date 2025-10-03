"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, Info, ShoppingCart, ArrowRight } from "lucide-react";
import { getAIReorderRecommendations } from "@/app/actions";
import type { Bearing, UsageLog } from "@/lib/types";
import { ReorderRecommendationsOutput } from "@/ai/flows/reorder-recommendations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type ReorderCardProps = {
  bearings: Bearing[];
  usageLog: UsageLog[];
  onUpdateBearing: (bearing: Bearing) => void;
};

export default function ReorderCard({ bearings, usageLog, onUpdateBearing }: ReorderCardProps) {
  const [recommendations, setRecommendations] =
    useState<ReorderRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reorderThreshold = 10;
  const leadTime = 7;

  const bearingsToReorder = bearings.filter(b => b.stock < b.threshold);

  const handleGetAIRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);

    const input = {
      bearingTypes: bearings.map((b) => b.name),
      historicalUsageData: JSON.stringify(
        usageLog.map((log) => ({
          bearing: log.bearingName,
          quantity: log.quantity,
          date: log.date,
          sector: log.sector,
        }))
      ),
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
       // Optionally update stock based on AI recommendations
       result.data.recommendations.forEach(rec => {
        const bearingToUpdate = bearings.find(b => b.name === rec.bearingType);
        if (bearingToUpdate) {
            // This is an example, you might want to confirm before updating
            // onUpdateBearing({...bearingToUpdate, stock: bearingToUpdate.stock + rec.quantityToReorder });
        }
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="text-primary" />
          Rodamientos para Reponer
        </CardTitle>
        <CardDescription>
          Estos artículos están por debajo de su umbral y necesitan atención.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow grid gap-4">
        {error && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error de IA</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          {bearingsToReorder.length > 0 ? bearingsToReorder.map((bearing) => (
            <div key={bearing.id} className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium">{bearing.name}</p>
                <div className="text-right">
                  <p className="font-bold text-lg text-destructive">{bearing.stock} en stock</p>
                  <p className="text-xs text-muted-foreground">Umbral: {bearing.threshold}</p>
                </div>
              </div>
               {recommendations && getAIRecommendationFor(bearing.name) !== null && (
                 <div className="mt-2 p-2 bg-primary/10 rounded-md flex items-center justify-between">
                   <p className="text-sm font-semibold flex items-center gap-1"><BrainCircuit size={16}/> IA recomienda:</p>
                   <p className="text-sm font-bold text-primary">{getAIRecommendationFor(bearing.name)} unidades</p>
                 </div>
               )}
            </div>
          )) : (
             <div className="text-center text-muted-foreground py-8">
                <p>¡Todo en orden!</p>
                <p className="text-sm">No hay artículos que necesiten reposición.</p>
             </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
            onClick={handleGetAIRecommendations}
            disabled={isLoading || bearings.length === 0}
            className="w-full"
        >
            {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
            <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            Obtener Sugerencias de IA
        </Button>
      </CardFooter>
    </Card>
  );
}
