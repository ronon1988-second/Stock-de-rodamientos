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
import { BrainCircuit, Loader2, Info, ShoppingCart, FileDown, Check, ChevronsUpDown, XCircle } from "lucide-react";
import { getAIReorderRecommendations } from "@/app/actions";
import type { InventoryItem, MachineAssignment, Sector, Machine, MachinesBySector } from "@/lib/types";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

type ToBuyViewProps = {
  inventory: InventoryItem[];
  machineAssignments: MachineAssignment[];
  sectors: Sector[];
  machinesBySector: MachinesBySector;
};

type ReorderInfo = {
    item: InventoryItem;
    totalRequired: number;
    toBuy: number;
}

export default function ToBuyView({ inventory, machineAssignments, sectors, machinesBySector }: ToBuyViewProps) {
  const [recommendations, setRecommendations] = useState<ReorderRecommendationsOutput | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);

  const filteredMachines = useMemo(() => {
    if (selectedSectorIds.length === 0) {
      return Object.values(machinesBySector).flat();
    }
    return selectedSectorIds.flatMap(sectorId => machinesBySector[sectorId] || []);
  }, [selectedSectorIds, machinesBySector]);

  const itemsToReorder = useMemo(() => {
    const relevantMachineAssignments = machineAssignments.filter(assignment => {
      const isSectorMatch = selectedSectorIds.length === 0 || selectedSectorIds.includes(assignment.sectorId);
      const isMachineMatch = selectedMachineIds.length === 0 || selectedMachineIds.includes(assignment.machineId);
      
      if (selectedMachineIds.length > 0) {
        return isMachineMatch;
      }
      return isSectorMatch;
    });

    const requiredByItem: { [itemId: string]: number } = {};
    relevantMachineAssignments.forEach(assignment => {
        if (!requiredByItem[assignment.itemId]) {
            requiredByItem[assignment.itemId] = 0;
        }
        requiredByItem[assignment.itemId] += assignment.quantity;
    });

    const items: ReorderInfo[] = [];
    inventory.forEach(item => {
        const totalRequired = requiredByItem[item.id] || 0;
        const safetyStock = item.threshold;
        const totalDemand = totalRequired + safetyStock;
        const toBuy = totalDemand - item.stock;

        if (toBuy > 0) {
            items.push({
                item,
                totalRequired,
                toBuy,
            });
        }
    });

    return items.sort((a,b) => a.item.name.localeCompare(b.item.name));
  }, [inventory, machineAssignments, selectedSectorIds, selectedMachineIds]);

  const handleGetAIRecommendations = async () => {
    setIsLoadingAI(true);
    setError(null);
    setRecommendations(null);
    
    const reorderThreshold = 2; // Can be made dynamic
    const leadTime = 7; // Can be made dynamic

    const input = {
      bearingTypes: itemsToReorder.map((info) => info.item.name),
      historicalUsageData: "N/A", 
      currentStockLevels: JSON.stringify(
        itemsToReorder.map((info) => ({
          bearing: info.item.name,
          stock: info.item.stock,
        }))
      ),
      reorderThreshold: reorderThreshold,
      leadTimeDays: leadTime,
    };

    if (input.bearingTypes.length === 0) {
      toast({
        title: "No hay artículos para analizar",
        description: "La lista de compras para la selección actual está vacía.",
        variant: "default",
      });
      setIsLoadingAI(false);
      return;
    }

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
    if (itemsToReorder.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,Artículo;Stock Actual;Total Requerido en Máquinas;Stock de Seguridad;Cantidad a Comprar (Calculado);Cantidad a Comprar (IA)\n";
    
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
  }

  // Multi-select popover component
  const MultiSelect = ({ title, options, selectedValues, onSelect }: { title: string, options: {value: string, label: string}[], selectedValues: string[], onSelect: (values: string[]) => void }) => {
    const [open, setOpen] = useState(false);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between w-full">
            <span className="truncate">{selectedValues.length > 0 ? `${title} (${selectedValues.length})` : `Todos los ${title.toLowerCase()}`}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder={`Buscar ${title.toLowerCase()}...`} />
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    const newSelection = selectedValues.includes(option.value)
                      ? selectedValues.filter((v) => v !== option.value)
                      : [...selectedValues, option.value];
                    onSelect(newSelection);
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
          </Command>
        </PopoverContent>
      </Popover>
    );
  }


  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="text-primary" />
                    Lista de Artículos para Comprar
                    </CardTitle>
                    <CardDescription>
                    Use los filtros para generar una lista de compras basada en sectores o máquinas específicas.
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleGetAIRecommendations}
                        disabled={isLoadingAI}
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
                        disabled={itemsToReorder.length === 0}
                        variant="outline"
                    >
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>
            <div className="border-t mt-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Filtro por Sector</label>
                    <MultiSelect 
                      title="Sectores"
                      options={sectors.map(s => ({ value: s.id, label: s.name }))}
                      selectedValues={selectedSectorIds}
                      onSelect={(values) => {
                        setSelectedSectorIds(values);
                        // Deselect machines that are not in the new selection of sectors
                        const newMachineIds = selectedMachineIds.filter(machineId => {
                          return values.some(sectorId => machinesBySector[sectorId]?.some(m => m.id === machineId));
                        });
                        setSelectedMachineIds(newMachineIds);
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">Filtro por Máquina</label>
                    <MultiSelect 
                      title="Máquinas"
                      options={filteredMachines.map(m => ({ value: m.id, label: m.name }))}
                      selectedValues={selectedMachineIds}
                      onSelect={setSelectedMachineIds}
                    />
                  </div>
                  {(selectedSectorIds.length > 0 || selectedMachineIds.length > 0) && (
                    <div className="md:self-end">
                      <Button variant="ghost" onClick={handleClearFilters}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Limpiar Filtros
                      </Button>
                    </div>
                  )}
              </div>
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

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                  <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead className="text-right">Requerido (Máquinas)</TableHead>
                  <TableHead className="text-right">Stock de Seguridad</TableHead>
                  <TableHead className="text-right font-bold text-primary">Cantidad a Comprar</TableHead>
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
                        <p>¡Todo en orden! No hay artículos que necesiten reposición para la selección actual.</p>
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
