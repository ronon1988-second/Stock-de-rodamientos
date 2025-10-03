"use client";
import React, { useState } from "react";
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
import type { Bearing } from "@/lib/types";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type StockTableProps = {
  bearings: Bearing[];
  onLogUsage: (bearingId: string, quantity: number) => void;
};

export default function StockTable({ bearings, onLogUsage }: StockTableProps) {
  const [selectedBearing, setSelectedBearing] = useState<Bearing | null>(null);

  const getStatus = (bearing: Bearing) => {
    if (bearing.stock === 0) return "Sin Stock";
    if (bearing.stock <= bearing.threshold) return "Stock Bajo";
    return "En Stock";
  };

  const getStatusVariant = (status: string) => {
    if (status === "Sin Stock") return "destructive";
    if (status === "Stock Bajo") return "secondary";
    return "default";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Inventario de Rodamientos</CardTitle>
          <CardDescription>
            Vista en vivo de todos los rodamientos en stock en todos los sectores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bearings.length > 0 ? (
                bearings.map((bearing) => {
                  const status = getStatus(bearing);
                  return (
                    <TableRow key={bearing.id} className={status !== 'En Stock' ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-medium">{bearing.name}</TableCell>
                      <TableCell>{bearing.sector}</TableCell>
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
                            <DropdownMenuItem onSelect={() => setSelectedBearing(bearing)}>
                              Registrar Uso
                            </DropdownMenuItem>
                            <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Sin datos de rodamientos. Por favor, importe sus datos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedBearing && (
        <UpdateStockDialog
          bearing={selectedBearing}
          onClose={() => setSelectedBearing(null)}
          onConfirm={onLogUsage}
        />
      )}
    </>
  );
}
