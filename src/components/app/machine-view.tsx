
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { InventoryItem, Sector, Machine, MachineAssignment } from '@/lib/types';
import { PackagePlus, Trash2 } from 'lucide-react';
import AssignItemDialog from './assign-item-dialog';
import UpdateStockDialog from './update-stock-dialog';

type MachineViewProps = {
    sector: Sector;
    machine: Machine;
    allInventory: InventoryItem[];
    machineAssignments: MachineAssignment[];
    onAssignItem: (itemId: string, machineId: string, sectorId: string, quantity: number) => void;
    onRemoveItem: (assignmentId: string) => void;
    onLogUsage: (itemId: string, quantity: number, machineId: string, sectorId: string) => void;
    canEdit: boolean;
};

export default function MachineView({ sector, machine, allInventory, machineAssignments, onAssignItem, onRemoveItem, onLogUsage, canEdit }: MachineViewProps) {
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [logUsageItem, setLogUsageItem] = useState<InventoryItem | null>(null);

    const assignedItemsDetails = machineAssignments.map(item => {
        const itemDetails = allInventory.find(b => b.id === item.itemId);
        return {
            ...item,
            stock: itemDetails?.stock ?? 'N/A',
            threshold: itemDetails?.threshold ?? 0,
            inventoryItem: itemDetails
        };
    }).sort((a, b) => a.itemName.localeCompare(b.itemName));

    return (
        <>
            <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle>Artículos en {machine.name}</CardTitle>
                            <CardDescription>
                                Esta es la lista de artículos asignados a esta máquina y la cantidad requerida.
                            </CardDescription>
                        </div>
                        {canEdit && (
                            <Button onClick={() => setIsAssignDialogOpen(true)}>
                                <PackagePlus className="mr-2 h-4 w-4" />
                                Asignar Artículo
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Artículo</TableHead>
                                    <TableHead className="text-right">Cantidad Asignada</TableHead>
                                    <TableHead className="text-right">Stock General Actual</TableHead>
                                    {canEdit && <TableHead className="w-[120px]">Acciones</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedItemsDetails.length > 0 ? (
                                    assignedItemsDetails.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.itemName}</TableCell>
                                            <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{item.stock}</TableCell>
                                            {canEdit && (
                                                <TableCell className="flex justify-end gap-1">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        disabled={item.inventoryItem?.stock === 0}
                                                        onClick={() => item.inventoryItem && setLogUsageItem(item.inventoryItem)}
                                                    >
                                                        Registrar Uso
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => onRemoveItem(item.id)}
                                                        aria-label={`Quitar ${item.itemName}`}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={canEdit ? 4 : 3} className="h-24 text-center">
                                            Aún no se han asignado artículos a esta máquina.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {isAssignDialogOpen && canEdit && (
                <AssignItemDialog
                    sector={sector}
                    machine={machine}
                    allInventory={allInventory}
                    onClose={() => setIsAssignDialogOpen(false)}
                    onAssign={onAssignItem}
                />
            )}
             {logUsageItem && canEdit && (
                <UpdateStockDialog
                    key={`log-${logUsageItem.id}`}
                    item={logUsageItem}
                    onClose={() => setLogUsageItem(null)}
                    onConfirm={(itemId, quantity) => onLogUsage(itemId, quantity, machine.id, sector.id)}
                    mode="logUsage"
                />
            )}
        </>
    );
}
