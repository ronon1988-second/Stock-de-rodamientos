
"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, Info, ShoppingCart, FileDown, FileSearch, XCircle } from "lucide-react";
import { getAIReorderRecommendations } from "@/app/actions";
import type { InventoryItem, MachineAssignment, Sector, MachinesBySector, ItemCategory } from "@/lib/types";
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
import { Skeleton } from "../ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


type ToBuyViewProps = {
  inventory: InventoryItem[];
  machineAssignments: MachineAssignment[];
  sectors: Sector[];
  machinesBySector: MachinesBySector;
  isLoading: boolean;
};

type ReorderInfo = {
    item: InventoryItem;
    totalRequired: number;
    toBuy: number;
}

const itemCategories: (ItemCategory | 'all')[] = ['all', 'rodamientos', 'correas', 'lonas', 'pistones', 'otros'];


export default function ToBuyView({ inventory, machineAssignments, sectors, machinesBySector, isLoading }: ToBuyViewProps) {
  const [recommendations, setRecommendations] = useState<ReorderRecommendationsOutput | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | 'all'>('all');

  const [itemsToReorder, setItemsToReorder] = useState<ReorderInfo[] | null>(null);

  const calculateItemsToReorder = useCallback(() => {
    const requiredByItem: { [itemId: string]: number } = {};
    machineAssignments.forEach(assignment => {
        if (!requiredByItem[assignment.itemId]) {
            requiredByItem[assignment.itemId] = 0;
        }
        requiredByItem[assignment.itemId] += assignment.quantity;
    });

    let items: ReorderInfo[] = [];

    const filteredInventory = inventory.filter(item => {
        if (categoryFilter === 'all') return true;
        if (!item.category && categoryFilter === 'otros') return true;
        return item.category === categoryFilter;
    });

    filteredInventory.forEach(item => {
        const totalRequired = requiredByItem[item.id] || 0;
        const safetyStock = item.threshold;
        const totalDemand = totalRequired + safetyStock;
        const toBuy = totalDemand - item.stock;

        if (toBuy > 0) {
            items.push({ item, totalRequired, toBuy });
        }
    });

    return items.sort((a, b) => a.item.name.localeCompare(b.item.name));
  }, [inventory, machineAssignments, categoryFilter]);

  const handleGenerateList = () => {
    setRecommendations(null); // Clear old AI recommendations
    setError(null);
    const calculatedItems = calculateItemsToReorder();
    setItemsToReorder(calculatedItems);
    if(calculatedItems.length === 0) {
        toast({
            title: "No hay artículos para reponer",
            description: `No se encontraron artículos para reponer en la categoría seleccionada.`,
        });
    }
  };


  const handleGetAIRecommendations = async () => {
    if (!itemsToReorder || itemsToReorder.length === 0) {
      toast({
        title: "Primero genere una lista",
        description: "La lista de compras está vacía. Genere una lista para analizar.",
        variant: "default",
      });
      return;
    }

    setIsLoadingAI(true);
    setError(null);
    setRecommendations(null);
    
    const input = {
      bearingTypes: itemsToReorder.map((info) => info.item.name),
      historicalUsageData: "N/A", 
      currentStockLevels: JSON.stringify(
        itemsToReorder.map((info) => ({
          bearing: info.item.name,
          stock: info.item.stock,
        }))
      ),
      reorderThreshold: 2, // Hardcoded for now, can be dynamic
      leadTimeDays: 7, // Hardcoded for now, can be dynamic
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

    setIsLoadingAI(false);
  };
  
  const getAIRecommendationFor = (itemName: string) => {
    if (!recommendations) return null;
    const rec = recommendations.recommendations.find(r => r.bearingType === itemName);
    return rec ? rec.quantityToReorder : null;
  }
  
  const exportToCSV = () => {
    if (!itemsToReorder || itemsToReorder.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,Artículo;Categoría;Stock Actual;Requerido (Máquinas);Umbral Seguridad;A Comprar (Calculado);A Comprar (IA)\n";
    
    itemsToReorder.forEach(itemInfo => {
        const { item, totalRequired, toBuy } = itemInfo;
        const aiQty = getAIRecommendationFor(item.name) ?? "";
        csvContent += `${item.name};${item.category || 'Sin categoría'};${item.stock};${totalRequired};${item.threshold};${toBuy};${aiQty}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orden_de_compra_${categoryFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleClear = () => {
    setItemsToReorder(null);
    setRecommendations(null);
    setCategoryFilter('all');
  }

  if (isLoading) {
    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="text-primary" />
                    Lista de Artículos para Comprar
                    </CardTitle>
                    <CardDescription>
                    Genere una lista de artículos que necesitan reposición basados en el stock actual, el umbral de seguridad y las asignaciones a máquinas.
                    </CardDescription>
                </div>
                 <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row">
                    <Button
                        onClick={handleGetAIRecommendations}
                        disabled={isLoadingAI || !itemsToReorder}
                    >
                        {isLoadingAI ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        )}
                        Sugerencias IA
                    </Button>
                    <Button 
                        onClick={exportToCSV}
                        disabled={!itemsToReorder || itemsToReorder.length === 0}
                        variant="outline"
                    >
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>
             <div className="border-t mt-4 pt-4 flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="grid gap-2 sm:w-1/3">
                    <label className="text-sm font-medium">Filtrar por Categoría</label>
                    <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por categoría" />
                        </SelectTrigger>
                        <SelectContent>
                             {itemCategories.map(cat => (
                                <SelectItem key={cat} value={cat} className="capitalize">
                                    {cat === 'all' ? 'Todas las Categorías' : cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
               <div className="flex items-center gap-2">
                    <Button onClick={handleGenerateList}>
                        <FileSearch className="mr-2 h-4 w-4" />
                        Generar Lista
                    </Button>
                    {itemsToReorder && (
                        <Button variant="ghost" onClick={handleClear}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Limpiar
                        </Button>
                    )}
                </div>
            </div>
        </CardHeader>

        {itemsToReorder &&
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Error de IA</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                  <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Requerido (Máq.)</TableHead>
                  <TableHead className="text-right">Umbral</TableHead>
                  <TableHead className="text-right font-bold text-primary">A Comprar</TableHead>
                  {recommendations && <TableHead className="text-right font-bold">Sugerencia IA</TableHead>}
                  </TableRow>
              </TableHeader>
              <TableBody>
                {itemsToReorder.length > 0 ? (
                  itemsToReorder.map((itemInfo) => {
                      const { item, totalRequired, toBuy } = itemInfo;
                      const aiRecommendation = getAIRecommendationFor(item.name);
                      return (
                      <TableRow key={item.id} className="bg-amber-500/5">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-muted-foreground capitalize">{item.category || 'Sin categoría'}</TableCell>
                          <TableCell className="text-right text-destructive font-semibold">{item.stock}</TableCell>
                          <TableCell className="text-right">{totalRequired}</TableCell>
                          <TableCell className="text-right">{item.threshold}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{toBuy}</TableCell>
                          {recommendations && (
                            <TableCell className="text-right font-bold">
                                {aiRecommendation !== null ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <BrainCircuit size={16} className="text-blue-500" />
                                      <span>{aiRecommendation}</span>
                                    </div>
                                ) : '-'}
                            </TableCell>                          
                          )}
                      </TableRow>
                      )
                  })
                ) : (
                  <TableRow>
                      <TableCell colSpan={recommendations ? 7 : 6} className="h-48 text-center text-muted-foreground">
                        <p>¡Todo en orden! No hay artículos que necesiten reposición en la categoría seleccionada.</p>
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        }

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
