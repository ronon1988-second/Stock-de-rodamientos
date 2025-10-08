
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


type ToBuyViewProps = {
  inventory: InventoryItem[];
  machineAssignments: MachineAssignment[];
};

type ReorderInfo = {
    item: InventoryItem;
    totalRequired: number;
    toBuy: number;
}

const getItemSeries = (name: string): string => {
  const normalizedName = name.toUpperCase().trim();
  if (normalizedName.startsWith('HTD')) return 'Correas';
  if (normalizedName.startsWith('H')) return 'Manguitos de Montaje';
  if (normalizedName.startsWith('6')) {
    const series = normalizedName.substring(0, 2);
    if (['60', '62', '63', '68', '69'].includes(series)) {
      return `Rodamientos Serie ${series}xx`;
    }
  }
  if (normalizedName.startsWith('UC')) return 'Rodamientos Serie UC (Insertos)';
  if (normalizedName.startsWith('12') || normalizedName.startsWith('13') || normalizedName.startsWith('22') || normalizedName.startsWith('23')) {
    const series = normalizedName.substring(0, 2);
    if (['12', '13', '22', '23'].includes(series)) {
        return `Rodamientos Serie ${series}xx (Autoalineables)`;
    }
  }
  if (normalizedName.startsWith('30') || normalizedName.startsWith('32') || normalizedName.startsWith('33')) {
      const series = normalizedName.substring(0, 2);
      return `Rodamientos Serie ${series}xxx (Rodillos Cónicos)`;
  }
  if (normalizedName.startsWith('NK') || normalizedName.startsWith('RNA') || normalizedName.startsWith('HK')) return 'Rodamientos de Agujas';
  if (normalizedName.startsWith('PHS') || normalizedName.startsWith('POS')) return 'Terminales de Rótula';
  if (normalizedName.startsWith('AEVU')) return 'Pistones';
  if (normalizedName.startsWith('FL')) return 'Soportes';
  
  return 'Otros';
};


export default function ToBuyView({ inventory, machineAssignments }: ToBuyViewProps) {
  const [recommendations, setRecommendations] =
    useState<ReorderRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const leadTime = 7;

  const groupedItemsToReorder = useMemo(() => {
    const requiredByItem: { [itemId: string]: number } = {};
    machineAssignments.forEach(item => {
        if (!requiredByItem[item.itemId]) {
            requiredByItem[item.itemId] = 0;
        }
        requiredByItem[item.itemId] += item.quantity;
    });

    const itemsToReorder: ReorderInfo[] = [];

    inventory.forEach(item => {
        const totalRequired = requiredByItem[item.id] || 0;
        const safetyStock = item.threshold;
        const totalDemand = totalRequired + safetyStock;
        const toBuy = totalDemand - item.stock;

        if (toBuy > 0) {
            itemsToReorder.push({
                item,
                totalRequired,
                toBuy,
            });
        }
    });

    const grouped = itemsToReorder.reduce((acc, item) => {
        const series = getItemSeries(item.item.name);
        if (!acc.has(series)) {
            acc.set(series, []);
        }
        acc.get(series)!.push(item);
        return acc;
    }, new Map<string, ReorderInfo[]>());

    grouped.forEach(items => items.sort((a, b) => a.item.name.localeCompare(b.item.name)));
    
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [inventory, machineAssignments]);

  const totalItemsToReorderCount = useMemo(() => {
    return Array.from(groupedItemsToReorder.values()).reduce((acc, items) => acc + items.length, 0);
  }, [groupedItemsToReorder]);


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
    let csvContent = "data:text/csv;charset=utf-8,Artículo;Stock Actual;Total Requerido en Máquinas;Stock de Seguridad;Cantidad a Comprar (Calculado);Cantidad a Comprar (IA)\n";
    
    for (const items of groupedItemsToReorder.values()) {
        items.forEach(itemInfo => {
            const { item, totalRequired, toBuy } = itemInfo;
            const aiQty = getAIRecommendationFor(item.name) ?? "";
            csvContent += `${item.name};${item.stock};${totalRequired};${item.threshold};${toBuy};${aiQty}\n`;
        });
    }

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
                    disabled={isLoading || totalItemsToReorderCount === 0}
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
                    disabled={totalItemsToReorderCount === 0}
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

          {totalItemsToReorderCount > 0 ? (
            <Accordion type="multiple" className="w-full">
              {Array.from(groupedItemsToReorder.entries()).map(([series, items]) => (
                <AccordionItem value={series} key={series}>
                  <AccordionTrigger className="text-lg font-semibold sticky top-0 bg-card z-10 px-4 py-3 border-b">
                    {series} ({items.length})
                  </AccordionTrigger>
                  <AccordionContent>
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
                        {items.map((itemInfo) => {
                          const { item, totalRequired, toBuy } = itemInfo;
                          const aiRecommendation = getAIRecommendationFor(item.name);
                          return (
                            <TableRow key={item.id} className="bg-amber-500/5">
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-right text-destructive font-semibold">{item.stock}</TableCell>
                              <TableCell className="text-right">{totalRequired}</TableCell>
                              <TableCell className="text-right">{item.threshold}</TableCell>
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
                          )
                        })}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             <div className="h-48 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <CheckCircle className="h-10 w-10 text-green-500"/>
                <p className="text-lg font-semibold">¡Todo en orden!</p>
                <p className="text-sm">No hay artículos que necesiten reposición en este momento.</p>
            </div>
          )}
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
