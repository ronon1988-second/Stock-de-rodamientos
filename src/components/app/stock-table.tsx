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
    if (bearing.stock === 0) return "Out of Stock";
    if (bearing.stock <= bearing.threshold) return "Low Stock";
    return "In Stock";
  };

  const getStatusVariant = (status: string) => {
    if (status === "Out of Stock") return "destructive";
    if (status === "Low Stock") return "secondary";
    return "default";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bearing Inventory</CardTitle>
          <CardDescription>
            Live view of all bearings in stock across all sectors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bearings.length > 0 ? (
                bearings.map((bearing) => {
                  const status = getStatus(bearing);
                  return (
                    <TableRow key={bearing.id} className={status !== 'In Stock' ? 'bg-destructive/5' : ''}>
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
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => setSelectedBearing(bearing)}>
                              Log Usage
                            </DropdownMenuItem>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No bearing data. Please import your data.
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
