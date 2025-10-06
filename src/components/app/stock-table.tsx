
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
import type { InventoryItem, Sector } from "@/lib/types";
import { MoreHorizontal, Search, ChevronRight, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AddItemDialog from "./add-item-dialog";

type StockTableProps = {
  inventory: InventoryItem[];
  onLogUsage: (itemId: string, quantity: number, sector: Sector) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  title?: string;
  description?: string;
};

// Function to determine item series
const getItemSeries = (name: string): string => {
  const normalizedName = name.toUpperCase().trim();
  if (normalizedName.startsWith('6')) {
    const series = normalizedName.substring(0, 2);
    if (['60', '62', '63', '68', '69'].includes(series)) {
      return `Serie ${series}xx`;
    }
  }
  if (normalizedName.startsWith('UC')) return 'Serie UC (Insertos)';
  if (normalizedName.startsWith('12') || normalizedName.startsWith('13') || normalizedName.startsWith('22') || normalizedName.startsWith('23')) {
    const series = normalizedName.substring(0, 2);
    if (['12', '13', '22', '23'].includes(series)) {
        return `Serie ${series}xx (Autoalineables)`;
    }
  }
  if (normalizedName.startsWith('30') || normalizedName.startsWith('32')) {
      const series = normalizedName.substring(0, 2);
      return `Serie ${series}xxx (Rodillos Cónicos)`;
  }
  if (normalizedName.startsWith('NK') || normalizedName.startsWith('RNA') || normalizedName.startsWith('HK')) return 'Rodamientos de Agujas';
  if (normalizedName.startsWith('PHS') || normalizedName.startsWith('POS')) return 'Terminales de Rótula';
  if (normalizedName.startsWith('H')) return 'Manguitos de Montaje';
  if (normalizedName.startsWith('HTD')) return 'Correas';
  if (normalizedName.startsWith('AEVU')) return 'Pistones';
  
  return 'Otros';
};


export default function StockTable({ inventory, onLogUsage, onUpdateItem, onAddItem, title, description }: StockTableProps) {
  const [logUsageItem, setLogUsageItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);

  const groupedItems = useMemo(() => {
    const filtered = inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups = filtered.reduce((acc, item) => {
      const series = getItemSeries(item.name);
      if (!acc[series]) {
        acc[series] = [];
      }
      acc[series].push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);

    // Sort groups
    Object.values(groups).forEach(group => group.sort((a, b) => a.name.localeCompare(b.name)));
    
    // Set all as open if there is a search term
    if(searchTerm){
        setOpenCollapsibles(Object.keys(groups));
    } else {
        setOpenCollapsibles([]);
    }

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [inventory, searchTerm]);

  const toggleCollapsible = (series: string) => {
    setOpenCollapsibles(prev => 
      prev.includes(series) ? prev.filter(s => s !== series) : [...prev, series]
    );
  };

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
            <Button onClick={() => setAddingItem(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Artículo
            </Button>
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
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
                {groupedItems.length > 0 ? (
                  groupedItems.map(([series, itemsInGroup]) => (
                    <Collapsible asChild key={series} open={openCollapsibles.includes(series)} onOpenChange={() => toggleCollapsible(series)}>
                      <tbody className="w-full">
                        <CollapsibleTrigger asChild>
                           <TableRow className="bg-muted/50 hover:bg-muted cursor-pointer">
                              <TableCell colSpan={4} className="font-bold">
                                <div className="flex items-center gap-2">
                                  <ChevronRight className={`h-4 w-4 transition-transform ${openCollapsibles.includes(series) ? 'rotate-90' : ''}`} />
                                  {series} ({itemsInGroup.length})
                                </div>
                              </TableCell>
                           </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <>
                            {itemsInGroup.map((item) => {
                              const status = getStatus(item);
                              return (
                                <TableRow key={item.id} className={status === 'Stock Bajo' ? 'bg-amber-500/10' : status === 'Sin Stock' ? 'bg-destructive/10' : ''}>
                                  <TableCell className="font-medium pl-12">{item.name}</TableCell>
                                  <TableCell className="text-right">{item.stock}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant={getStatusVariant(status)}>{status}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">Alternar menú</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuItem onSelect={() => setLogUsageItem(item)}>
                                          Registrar Uso
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setEditingItem(item)}>
                                          Actualizar Stock
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </>
                        </CollapsibleContent>
                      </tbody>
                    </Collapsible>
                  ))
                ) : (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {searchTerm ? "No se encontraron artículos." : "No hay artículos en el inventario."}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {addingItem && (
        <AddItemDialog
          onClose={() => setAddingItem(false)}
          onConfirm={onAddItem}
          existingNames={inventory.map(i => i.name)}
        />
      )}
      
      {logUsageItem && (
        <UpdateStockDialog
          key={`log-${logUsageItem.id}`}
          item={logUsageItem}
          onClose={() => setLogUsageItem(null)}
          onConfirm={(itemId, quantity, sector) => onLogUsage(itemId, quantity, sector!)}
          mode="logUsage"
        />
      )}

      {editingItem && (
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
