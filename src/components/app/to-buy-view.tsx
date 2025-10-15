
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
import { BrainCircuit, Loader2, Info, ShoppingCart, FileDown, Check, ChevronsUpDown, XCircle, FileSearch } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { cn } from "@/lib/utils";
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

const CATEGORIES: { value: ItemCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas las Categorías' },
  { value: 'rodamientos', label: 'Rodamientos' },
  { value: 'pistones', label: 'Pistones' },
  { value: 'lonas', label: 'Lonas' },
  { value: 'correas', label: 'Correas' },
  { value: 'otros', label: 'Otros' },
];

export default function ToBuyView({ inventory, machineAssignments, sectors, machinesBySector, isLoading }: ToBuyViewProps) {
  const [recommendations, setRecommendations] = useState<ReorderRecommendationsOutput | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [itemsToReorder, setItemsToReorder] = useState<ReorderInfo[] | null>(null);

  const calculateItemsToReorder = useCallback(() => {
    let relevantInventory = inventory;
    if (selectedCategory !== 'all') {
      relevantInventory = inventory.filter(item => item.category === selectedCategory);
    }
    
    const requiredByItem: { [itemId: string]: number } = {};
    machineAssignments.forEach(assignment => {
        if (!requiredByItem[assignment.itemId]) {
            requiredByItem[assignment.itemId] = 0;
        }
        requiredByItem[assignment.itemId] += assignment.quantity;
    });

    let items: ReorderInfo[] = [];

    relevantInventory.forEach(item => {
        const totalRequired = requiredByItem[item.id] || 0;
        const safetyStock = item.threshold;
        
        let toBuy = 0;
        // If no category is filtered, we check global needs (assignments + threshold)
        if (selectedCategory === 'all') {
            const totalDemand = totalRequired + safetyStock;
            toBuy = totalDemand - item.stock;
        } else {
            // If a category is filtered, we only care about replenishing for assignments
            toBuy = totalRequired - item.stock;
        }

        if (toBuy > 0) {
            items.push({ item, totalRequired, toBuy });
        }
    });

    return items.sort((a, b) => a.item.name.localeCompare(b.item.name));
  }, [inventory, machineAssignments, selectedCategory]);

  const handleGenerateList = () => {
    setRecommendations(null); // Clear old AI recommendations
    setError(null);
    const calculatedItems = calculateItemsToReorder();
    setItemsToReorder(calculatedItems);
    if(calculatedItems.length === 0) {
        toast({
            title: "No hay artículos para reponer",
            description: "La lista de compras para la selección actual está vacía."
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
        const categoryLabel = CATEGORIES.find(c => c.value === item.category)?.label || 'Otros';
        const aiQty = getAIRecommendationFor(item.name) ?? "";
        csvContent += `${item.name};${categoryLabel};${item.stock};${totalRequired};${item.threshold};${toBuy};${aiQty}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orden_de_compra_${selectedCategory}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setItemsToReorder(null);
    setRecommendations(null);
  }
  
  const hasActiveFilters = selectedCategory !== 'all';

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
                    Filtre por categoría y genere una lista de compras. Si no aplica filtros, se mostrarán todos los artículos que requieran reposición en el inventario general (por asignación y por umbral).
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
            <div className="border-t mt-4 pt-4">
               <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="grid gap-1.5 w-full sm:w-auto sm:flex-1 sm:max-w-[300px]">
                    <label className="text-sm font-medium">Filtro por Categoría</label>
                    <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ItemCategory | 'all')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                   <div className="flex gap-2">
                      <Button onClick={handleGenerateList}>
                          <FileSearch className="mr-2 h-4 w-4" />
                          Generar
                      </Button>
                      {hasActiveFilters && (
                        <Button variant="ghost" onClick={handleClearFilters} size="icon">
                            <XCircle className="h-5 w-5" />
                            <span className="sr-only">Limpiar Filtros</span>
                        </Button>
                      )}
                    </div>
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
                      <TableCell colSpan={recommendations ? 6 : 5} className="h-48 text-center text-muted-foreground">
                        <p>¡Todo en orden! No hay artículos que necesiten reposición para los filtros seleccionados.</p>
                        <p className="text-xs">Pruebe con otros filtros o genere la lista para "Todas las categorías".</p>
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
