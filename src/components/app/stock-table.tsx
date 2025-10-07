
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
import type { InventoryItem } from "@/lib/types";
import { MoreHorizontal, Search, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import AddItemDialog from "./add-item-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type StockTableProps = {
  inventory: InventoryItem[];
  onUpdateItem: (item: InventoryItem) => void;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  canEdit: boolean;
  title?: string;
  description?: string;
};

// Function to determine item series
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


export default function StockTable({ inventory, onUpdateItem, onAddItem, canEdit, title, description }: StockTableProps) {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const groupedAndFilteredItems = useMemo(() => {
    const filtered = inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!filtered.length) {
        return new Map<string, InventoryItem[]>();
    }

    const grouped = filtered.reduce((acc, item) => {
        const series = getItemSeries(item.name);
        if (!acc.has(series)) {
            acc.set(series, []);
        }
        acc.get(series)!.push(item);
        return acc;
    }, new Map<string, InventoryItem[]>());

    // Sort items within each group
    grouped.forEach(items => items.sort((a, b) => a.name.localeCompare(b.name)));
    
    // Sort groups by name
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));

  }, [inventory, searchTerm]);


  const getStatus = (item: InventoryItem) => {
    if (item.stock === 0) return "Sin Stock";
    if (item.stock < item.threshold) return "Stock Bajo";
    return "En Stock";
  };

  const getStatusVariant = (status: string): "destructive" | "secondary" | "default" => {
    if (status === "Sin Stock") return "destructive";
    if (status === "Stock Bajo") return "secondary";
    return "default";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{title || 'Inventario General'}</CardTitle>
              <CardDescription>
                {description || 'Busca, visualiza y gestiona todo tu inventario.'}
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={() => setAddingItem(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Artículo
              </Button>
            )}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por código de artículo..."
              className="pl-8 sm:w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[60vh] overflow-auto">
            <Accordion type="multiple" className="w-full">
                {Array.from(groupedAndFilteredItems.entries()).map(([series, items]) => (
                    <AccordionItem value={series} key={series}>
                        <AccordionTrigger className="text-lg font-semibold sticky top-0 bg-card z-10 px-4 py-3 border-b">
                            {series} ({items.length})
                        </AccordionTrigger>
                        <AccordionContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    {canEdit && 
                                        <TableHead>
                                        <span className="sr-only">Acciones</span>
                                        </TableHead>
                                    }
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => {
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
                                            {canEdit &&
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
                                                    <DropdownMenuItem
                                                        onSelect={() => setEditingItem(item)}
                                                    >
                                                        Actualizar Stock
                                                    </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                </TableCell>
                                            }
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </AccordionContent>
                    </AccordionItem>
                ))}
                {groupedAndFilteredItems.size === 0 && (
                     <div className="text-center py-10 text-muted-foreground">
                        {searchTerm ? "No se encontraron artículos." : "No hay artículos en el inventario."}
                    </div>
                )}
            </Accordion>
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
            onConfirm={(itemId, newStock) => {
              onUpdateItem({ ...editingItem, stock: newStock });
            }}
            mode="updateStock"
        />
      )}
    </>
  );
}
