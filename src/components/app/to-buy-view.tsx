
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
import type { InventoryItem, MachineAssignment, Sector, MachinesBySector } from "@/lib/types";
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

const MultiSelect = ({ title, options, selectedValues, onSelect, disabled }: { title: string, options: {value: string, label: string}[], selectedValues: string[], onSelect: (values: string[]) => void, disabled?: boolean }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelect(newSelection);
  };
  
  const getButtonLabel = () => {
    if (selectedValues.length === 0) {
      return `Todos los ${title.toLowerCase()}`;
    }
    if (selectedValues.length === 1) {
      const selectedOption = options.find(o => o.value === selectedValues[0]);
      return selectedOption ? selectedOption.label : `1 ${title.slice(0, -1)} seleccionado`;
    }
    return `${selectedValues.length} ${title.toLowerCase()} seleccionados`;
  };


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" disabled={disabled}>
          <span className="block truncate">
            {getButtonLabel()}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={`Buscar ${title.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    handleSelect(option.value);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


export default function ToBuyView({ inventory, machineAssignments, sectors, machinesBySector, isLoading }: ToBuyViewProps) {
  const [recommendations, setRecommendations] = useState<ReorderRecommendationsOutput | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);
  
  const [itemsToReorder, setItemsToReorder] = useState<ReorderInfo[] | null>(null);

  const filteredMachines = useMemo(() => {
    if (selectedSectorIds.length === 0) {
      return Object.values(machinesBySector).flat().sort((a, b) => a.name.localeCompare(b.name));
    }
    return selectedSectorIds.flatMap(sectorId => machinesBySector[sectorId] || []).sort((a,b) => a.name.localeCompare(b.name));
  }, [selectedSectorIds, machinesBySector]);


  const calculateItemsToReorder = useCallback(() => {
    const isFiltering = selectedSectorIds.length > 0 || selectedMachineIds.length > 0;

    let items: ReorderInfo[] = [];

    if (isFiltering) {
        // --- LOGIC FOR FILTERED VIEW ---
        const relevantMachineAssignments = machineAssignments.filter(assignment => {
            const isSectorSelected = selectedSectorIds.length > 0;
            const isMachineSelected = selectedMachineIds.length > 0;

            if (isMachineSelected) {
                return selectedMachineIds.includes(assignment.machineId);
            }
            if (isSectorSelected) {
                return selectedSectorIds.includes(assignment.sectorId);
            }
            return false;
        });

        const requiredByItem: { [itemId: string]: number } = {};
        relevantMachineAssignments.forEach(assignment => {
            if (!requiredByItem[assignment.itemId]) {
                requiredByItem[assignment.itemId] = 0;
            }
            requiredByItem[assignment.itemId] += assignment.quantity;
        });
        
        for (const itemId in requiredByItem) {
            const item = inventory.find(i => i.id === itemId);
            if (!item) continue;

            const totalRequired = requiredByItem[itemId] || 0;
            const toBuy = totalRequired - item.stock;

            if (toBuy > 0) {
                items.push({ item, totalRequired, toBuy });
            }
        }
    } else {
        // --- LOGIC FOR "ALL" VIEW (no filters) ---
        // Include items based on assignments AND items below global threshold
        const requiredByItem: { [itemId: string]: number } = {};
        machineAssignments.forEach(assignment => {
            if (!requiredByItem[assignment.itemId]) {
                requiredByItem[assignment.itemId] = 0;
            }
            requiredByItem[assignment.itemId] += assignment.quantity;
        });

        inventory.forEach(item => {
            const totalRequired = requiredByItem[item.id] || 0;
            const safetyStock = item.threshold;
            const totalDemand = totalRequired + safetyStock;
            const toBuy = totalDemand - item.stock;

            if (toBuy > 0) {
                // Avoid duplicating items if already added
                if (!items.some(i => i.item.id === item.id)) {
                    items.push({ item, totalRequired, toBuy });
                }
            }
        });
    }

    return items.sort((a, b) => a.item.name.localeCompare(b.item.name));
  }, [inventory, machineAssignments, selectedSectorIds, selectedMachineIds]);

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
        description: "La lista de compras está vacía. Aplique filtros y genere una lista para analizar.",
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
    let csvContent = "data:text/csv;charset=utf-8,Artículo;Stock Actual;Requerido (Filtro);Stock de Seguridad;Cantidad a Comprar (Calculado);Cantidad a Comprar (IA)\n";
    
    itemsToReorder.forEach(itemInfo => {
        const { item, totalRequired, toBuy } = itemInfo;
        const aiQty = getAIRecommendationFor(item.name) ?? "";
        csvContent += `${item.name};${item.stock};${totalRequired};${item.threshold};${toBuy};${aiQty}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orden_de_compra_filtrada.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleClearFilters = () => {
    setSelectedSectorIds([]);
    setSelectedMachineIds([]);
    setItemsToReorder(null);
    setRecommendations(null);
  }
  
  const hasActiveFilters = selectedSectorIds.length > 0 || selectedMachineIds.length > 0;

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
                    Filtre por sector/máquina y genere una lista de compras. Si no aplica filtros, se mostrarán todos los artículos que requieran reposición en el inventario general.
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                        onClick={handleGetAIRecommendations}
                        disabled={isLoadingAI || !itemsToReorder}
                    >
                        {isLoadingAI ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        )}
                        Sugerencias de IA
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
               <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="grid gap-1.5 w-full md:w-auto md:flex-1 md:max-w-[300px]">
                    <label className="text-sm font-medium">Filtro por Sector</label>
                    <MultiSelect 
                      title="Sectores"
                      options={sectors.sort((a,b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: s.name }))}
                      selectedValues={selectedSectorIds}
                      onSelect={(values) => {
                        setSelectedSectorIds(values);
                        const newMachineIds = selectedMachineIds.filter(machineId => {
                          return values.some(sectorId => machinesBySector[sectorId]?.some(m => m.id === machineId));
                        });
                        setSelectedMachineIds(newMachineIds);
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5 w-full md:w-auto md:flex-1 md:max-w-[300px]">
                    <label className="text-sm font-medium">Filtro por Máquina</label>
                    <MultiSelect 
                      title="Máquinas"
                      options={filteredMachines.map(m => ({ value: m.id, label: m.name }))}
                      selectedValues={selectedMachineIds}
                      onSelect={setSelectedMachineIds}
                      disabled={filteredMachines.length === 0}
                    />
                  </div>
                   <div className="flex gap-2">
                      <Button onClick={handleGenerateList}>
                          <FileSearch className="mr-2 h-4 w-4" />
                          Generar Lista
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
                  <TableHead className="text-right">Requerido</TableHead>
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
                          <TableCell className="text-right font-bold text-primary">{toBuy}</TableCell>                          {recommendations && (
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
                        <p className="text-xs">Pruebe con otros filtros o revise el inventario general.</p>
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

    