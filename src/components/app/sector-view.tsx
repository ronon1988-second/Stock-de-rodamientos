"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { InventoryItem, Sector, SectorAssignment } from '@/lib/types';
import { PackagePlus, Trash2 } from 'lucide-react';
import AssignItemDialog from './assign-bearing-dialog';

type SectorViewProps = {
    sector: Sector;
    allInventory: InventoryItem[];
    sectorAssignments: SectorAssignment[];
    onAssignItem: (itemId: string, sector: Sector, quantity: number) => void;
    onRemoveItem: (assignmentId: string) => void;
};

export default function SectorView({ sector, allInventory, sectorAssignments, onAssignItem, onRemoveItem }: SectorViewProps) {
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

    // Get full item info for items in this sector's inventory
    const assignedItemsDetails = sectorAssignments.map(item => {
        const itemDetails = allInventory.find(b => b.id === item.itemId);
        return {
            ...item,
            stock: itemDetails?.stock ?? 'N/A',
        };
    }).sort((a, b) => a.itemName.localeCompare(b.itemName));

    return (
        <>
            <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle>Artículos en {sector}</CardTitle>
                            <CardDescription>
                                Esta es la lista de artículos asignados a este sector y la cantidad requerida.
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsAssignDialogOpen(true)}>
                            <PackagePlus className="mr-2 h-4 w-4" />
                            Asignar Artículo
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Artículo</TableHead>
                                    <TableHead className="text-right">Cantidad Asignada</TableHead>
                                    <TableHead className="text-right">Stock General Actual</TableHead>
                                    <TableHead className="w-[80px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedItemsDetails.length > 0 ? (
                                    assignedItemsDetails.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.itemName}</TableCell>
                                            <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{item.stock}</TableCell>
                                            <TableCell>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => onRemoveItem(item.id)}
                                                    aria-label={`Quitar ${item.itemName}`}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Aún no se han asignado artículos a este sector.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {isAssignDialogOpen && (
                <AssignItemDialog
                    sector={sector}
                    allInventory={allInventory}
                    onClose={() => setIsAssignDialogOpen(false)}
                    onAssign={onAssignItem}
                />
            )}
        </>
    );
}
