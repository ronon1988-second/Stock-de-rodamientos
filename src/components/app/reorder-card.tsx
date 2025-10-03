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
import { BrainCircuit, Loader2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAIReorderRecommendations } from "@/app/actions";
import type { Bearing, UsageLog } from "@/lib/types";
import { ReorderRecommendationsOutput } from "@/ai/flows/reorder-recommendations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type ReorderCardProps = {
  bearings: Bearing[];
  usageLog: UsageLog[];
};

export default function ReorderCard({ bearings, usageLog }: ReorderCardProps) {
  const [leadTime, setLeadTime] = useState("7");
  const [reorderThreshold, setReorderThreshold] = useState("10");
  const [recommendations, setRecommendations] =
    useState<ReorderRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetRecommendations = async () => {
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
      reorderThreshold: parseInt(reorderThreshold, 10),
      leadTimeDays: parseInt(leadTime, 10),
    };

    const result = await getAIReorderRecommendations(input);
    if (result.success && result.data) {
      setRecommendations(result.data);
    } else {
      setError(result.error || "Ocurrió un error desconocido.");
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="text-primary" />
          Asesor de Reposición con IA
        </CardTitle>
        <CardDescription>
          Obtenga recomendaciones inteligentes de reposición basadas en sus datos de uso.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reorder-threshold">Umbral de Reposición</Label>
            <Input
              id="reorder-threshold"
              type="number"
              value={reorderThreshold}
              onChange={(e) => setReorderThreshold(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-time">Tiempo de Entrega (Días)</Label>
            <Input
              id="lead-time"
              type="number"
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
            />
          </div>
        </div>
        <Button
          onClick={handleGetRecommendations}
          disabled={isLoading || bearings.length === 0}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BrainCircuit className="mr-2 h-4 w-4" />
          )}
          Generar Recomendaciones
        </Button>
        {error && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      {recommendations && (
        <>
          <Separator />
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Recomendaciones</h3>
            <div className="space-y-4">
              {recommendations.recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{rec.bearingType}</p>
                    <p className="font-bold text-lg text-primary">{rec.quantityToReorder} unidades</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{rec.reasoning}</p>
                </div>
              ))}
              <div className="p-3 bg-primary/10 rounded-lg mt-4">
                <div className="flex justify-between items-center font-bold">
                  <p>Valor Total Estimado</p>
                  <p className="text-xl">
                    ${recommendations.totalValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
