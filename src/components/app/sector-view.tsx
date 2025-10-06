"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Bearing, Sector, SectorInventory } from '@/lib/types';
import { PackagePlus, Trash2 } from 'lucide-react';
import AssignBearingDialog from './assign-bearing-dialog';

type SectorViewProps = {
    sector: Sector;
    allBearings: Bearing[];
    sectorInventory: SectorInventory[];
    onAssignBearing: (bearingId: string, sector: Sector, quantity: number) => void;
    onRemoveBearing: (assignmentId: string) => void;
};

export default function SectorView({ sector, allBearings, sectorInventory, onAssignBearing, onRemoveBearing }: SectorViewProps) {
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

    // Get full bearing info for items in this sector's inventory
    const assignedBearingsDetails = sectorInventory.map(item => {
        const bearingDetails = allBearings.find(b => b.id === item.bearingId);
        return {
            ...item,
            stock: bearingDetails?.stock ?? 'N/A',
        };
    }).sort((a, b) => a.bearingName.localeCompare(b.bearingName));

    return (
        <>
            <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle>Rodamientos en {sector}</CardTitle>
                            <CardDescription>
                                Esta es la lista de rodamientos asignados a este sector y la cantidad requerida.
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsAssignDialogOpen(true)}>
                            <PackagePlus className="mr-2 h-4 w-4" />
                            Asignar Rodamiento
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rodamiento</TableHead>
                                    <TableHead className="text-right">Cantidad Asignada</TableHead>
                                    <TableHead className="text-right">Stock General Actual</TableHead>
                                    <TableHead className="w-[80px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedBearingsDetails.length > 0 ? (
                                    assignedBearingsDetails.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.bearingName}</TableCell>
                                            <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{item.stock}</TableCell>
                                            <TableCell>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => onRemoveBearing(item.id)}
                                                    aria-label={`Quitar ${item.bearingName}`}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Aún no se han asignado rodamientos a este sector.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {isAssignDialogOpen && (
                <AssignBearingDialog
                    sector={sector}
                    allBearings={allBearings}
                    onClose={() => setIsAssignDialogOpen(false)}
                    onAssign={onAssignBearing}
                />
            )}
        </>
    );
}
