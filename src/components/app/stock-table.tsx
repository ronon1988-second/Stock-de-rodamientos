
"use client";
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UpdateStockDialog from "./update-stock-dialog";
import type { InventoryItem, MachinesBySector, Sector, ItemCategory } from "@/lib/types";
import { MoreHorizontal, Search, PlusCircle, FileDown, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import AddItemDialog from "./add-item-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type StockTableProps = {
  inventory: InventoryItem[];
  onUpdateItem: (item: InventoryItem) => void;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onLogUsage: (itemId: string, quantity: number, machineId: string | null, sectorId: string | null) => void;
  onDeleteItem: (itemId: string, itemName: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  title?: string;
  description?: string;
  sectors: Sector[];
  machinesBySector: MachinesBySector;
};

const CATEGORIES: { value: ItemCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas las Categorías' },
  { value: 'rodamientos', label: 'Rodamientos' },
  { value: 'pistones', label: 'Pistones' },
  { value: 'lonas', label: 'Lonas' },
  { value: 'correas', label: 'Correas' },
  { value: 'otros', label: 'Otros' },
];

export default function StockTable({ inventory, onUpdateItem, onAddItem, onLogUsage, onDeleteItem, canEdit, canDelete, title, description, sectors, machinesBySector }: StockTableProps) {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [logUsageItem, setLogUsageItem] = useState<InventoryItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');

  const filteredItems = useMemo(() => {
    return inventory
      .filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, searchTerm, selectedCategory]);

  const getStatus = (item: InventoryItem) => {
    if (item.stock === 0) return "Sin Stock";
    if (item.stock < item.threshold) return "Stock Bajo";
    return "En Stock";
  };

  const getGroupStatus = (items: InventoryItem[]) => {
    if (items.some(item => item.stock === 0)) {
      return 'out-of-stock'; // Most critical
    }
    if (items.some(item => item.stock < item.threshold)) {
      return 'low-stock'; // Less critical
    }
    return 'in-stock'; // All good
  };

  const groupedItems = useMemo(() => {
    const itemsToGroup = searchTerm ? filteredItems : inventory.filter(item => selectedCategory === 'all' || item.category === selectedCategory);
    
    const grouped = itemsToGroup.reduce((acc, item) => {
        const series = item.category || 'otros';
        if (!acc.has(series)) {
            acc.set(series, []);
        }
        acc.get(series)!.push(item);
        return acc;
    }, new Map<string, InventoryItem[]>());

    grouped.forEach(items => items.sort((a, b) => a.name.localeCompare(b.name)));
    
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));

  }, [inventory, searchTerm, selectedCategory, filteredItems]);


  const getStatusVariant = (status: string): "destructive" | "secondary" | "default" => {
    if (status === "Sin Stock") return "destructive";
    if (status === "Stock Bajo") return "secondary";
    return "default";
  };

  const exportAllToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Artículo;Categoría;Stock Actual;Umbral de Seguridad\n";
    
    filteredItems.forEach(item => {
        const categoryLabel = CATEGORIES.find(c => c.value === item.category)?.label || 'Otros';
        csvContent += `${item.name};${categoryLabel};${item.stock};${item.threshold}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventario_filtrado.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  const renderItemRow = (item: InventoryItem) => {
    const status = getStatus(item);
    return (
        <TableRow
        key={item.id}
        className={
            status === "Stock Bajo"
            ? "bg-amber-500/10"
            : status === "Sin Stock"
            ? "bg-destructive/10"
            : ""
        }
        >
        <TableCell className="font-medium">
            {item.name}
        </TableCell>
        <TableCell className="text-right">{item.stock}</TableCell>
        <TableCell className="text-center">
            <Badge variant={getStatusVariant(status)}>{status}</Badge>
        </TableCell>
        {(canEdit || canDelete) &&
            <TableCell>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button
                    aria-haspopup="true"
                    size="icon"
                    variant="ghost"
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Alternar menú</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    {canEdit && (
                      <>
                        <DropdownMenuItem
                            onSelect={() => setLogUsageItem(item)}
                            disabled={item.stock === 0}
                        >
                            Registrar Uso
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => setEditingItem(item)}
                        >
                            Actualizar/Editar
                        </DropdownMenuItem>
                      </>
                    )}
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar Artículo
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el artículo <strong>{item.name}</strong> del inventario.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteItem(item.id, item.name)}>
                                Sí, eliminar artículo
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            </TableCell>
        }
        </TableRow>
    );
  }

  const handleUpdate = (itemId: string, stock: number, threshold?: number, machineId?: string | null, sectorId?: string | null, category?: ItemCategory) => {
    if (!editingItem) return;
    onUpdateItem({ ...editingItem, stock: stock, threshold: threshold!, category: category! });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle>{title || 'Inventario General'}</CardTitle>
              <CardDescription>
                {description || 'Busca, visualiza y gestiona todo tu inventario.'}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row">
              {canEdit && (
                <>
                  <Button variant="outline" onClick={exportAllToCSV} disabled={inventory.length === 0}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                  <Button onClick={() => setAddingItem(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por código de artículo..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ItemCategory | 'all')}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {searchTerm ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            {(canEdit || canDelete) && <TableHead><span className="sr-only">Acciones</span></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.length > 0 ? (
                            filteredItems.map(renderItemRow)
                        ) : (
                            <TableRow>
                                <TableCell colSpan={canEdit || canDelete ? 4 : 3} className="h-24 text-center">
                                    No se encontraron artículos que coincidan con la búsqueda.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            ) : (
                <Accordion type="multiple" className="w-full">
                    {Array.from(groupedItems.entries()).map(([series, items]) => {
                        const groupStatus = getGroupStatus(items);
                        const categoryLabel = CATEGORIES.find(c => c.value === series)?.label || series;
                        return (
                        <AccordionItem value={series} key={series}>
                            <AccordionTrigger className="text-base font-semibold sticky top-0 bg-card z-10 px-4 py-3 border-b hover:no-underline">
                                <div className="flex items-center gap-3">
                                <span className={cn(
                                    "h-2.5 w-2.5 rounded-full",
                                    groupStatus === 'out-of-stock' && "bg-red-500",
                                    groupStatus === 'low-stock' && "bg-amber-500",
                                    groupStatus === 'in-stock' && "bg-green-500"
                                )}></span>
                                <span>{categoryLabel}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        {(canEdit || canDelete) && 
                                            <TableHead>
                                            <span className="sr-only">Acciones</span>
                                            </TableHead>
                                        }
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map(renderItemRow)}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                        )
                    })}
                    {groupedItems.size === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No hay artículos para la categoría seleccionada.
                        </div>
                    )}
                </Accordion>
            )}
          </div>
        </CardContent>
      </Card>

      {addingItem && canEdit && (
        <AddItemDialog
          onClose={() => setAddingItem(false)}
          onConfirm={onAddItem}
          existingNames={inventory.map(i => i.name)}
        />
      )}

      {editingItem && canEdit && (
         <UpdateStockDialog
            key={`edit-${editingItem.id}`}
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onConfirm={handleUpdate}
            mode="updateStock"
        />
      )}
      {logUsageItem && canEdit && (
         <UpdateStockDialog
            key={`log-${logUsageItem.id}`}
            item={logUsageItem}
            onClose={() => setLogUsageItem(null)}
            onConfirm={(itemId, quantity, _, machineId, sectorId) => {
              onLogUsage(itemId, quantity, machineId, sectorId);
            }}
            mode="logUsage"
            sectors={sectors}
            machinesBySector={machinesBySector}
        />
      )}
    </>
  );
}
