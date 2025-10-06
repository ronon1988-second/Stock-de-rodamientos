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
import type { Bearing, Sector } from "@/lib/types";
import { MoreHorizontal, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type StockTableProps = {
  bearings: Bearing[];
  onLogUsage: (bearingId: string, quantity: number, sector: Sector) => void;
  onUpdateBearing: (bearing: Bearing) => void;
  title?: string;
  description?: string;
};

export default function StockTable({ bearings, onLogUsage, onUpdateBearing, title, description }: StockTableProps) {
  const [logUsageBearing, setLogUsageBearing] = useState<Bearing | null>(null);
  const [editingBearing, setEditingBearing] = useState<Bearing | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBearings = useMemo(() => {
    return bearings.filter(bearing => 
      bearing.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [bearings, searchTerm]);

  const getStatus = (bearing: Bearing) => {
    if (bearing.stock === 0) return "Sin Stock";
    if (bearing.stock < bearing.threshold) return "Stock Bajo";
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
          <CardTitle>{title || 'Inventario de Rodamientos'}</CardTitle>
          <CardDescription>
            {description || 'Busca, visualiza y gestiona todo tu inventario de rodamientos.'}
          </CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por código de rodamiento..."
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
              <TableBody>
                {filteredBearings.length > 0 ? (
                  filteredBearings.map((bearing) => {
                    const status = getStatus(bearing);
                    return (
                      <TableRow key={bearing.id} className={status === 'Stock Bajo' ? 'bg-amber-500/10' : status === 'Sin Stock' ? 'bg-destructive/10' : ''}>
                        <TableCell className="font-medium">{bearing.name}</TableCell>
                        <TableCell className="text-right">{bearing.stock}</TableCell>
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
                              <DropdownMenuItem onSelect={() => setLogUsageBearing(bearing)}>
                                Registrar Uso
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setEditingBearing(bearing)}>
                                Actualizar Stock
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {searchTerm ? "No se encontraron rodamientos." : "No hay rodamientos en el inventario."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {logUsageBearing && (
        <UpdateStockDialog
          key={`log-${logUsageBearing.id}`}
          bearing={logUsageBearing}
          onClose={() => setLogUsageBearing(null)}
          onConfirm={(bearingId, quantity, sector) => onLogUsage(bearingId, quantity, sector!)}
          mode="logUsage"
        />
      )}

      {editingBearing && (
         <UpdateStockDialog
            key={`edit-${editingBearing.id}`}
            bearing={editingBearing}
            onClose={() => setEditingBearing(null)}
            onConfirm={(bearingId, newStock) => {
              onUpdateBearing({ ...editingBearing, stock: newStock });
            }}
            mode="updateStock"
        />
      )}
    </>
  );
}
