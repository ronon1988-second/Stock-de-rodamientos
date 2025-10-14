
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { InventoryItem, Sector, Machine, MachineAssignment } from '@/lib/types';
import { PackagePlus, Trash2 } from 'lucide-react';
import AssignItemDialog from './assign-item-dialog';
import UpdateStockDialog from './update-stock-dialog';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, getDoc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

type MachineViewProps = {
    machineId: string;
    allInventory: InventoryItem[];
    machineAssignments: MachineAssignment[];
    onAssignItem: (itemId: string, machineId: string, sectorId: string, quantity: number) => void;
    onRemoveItem: (assignmentId: string) => void;
    onLogUsage: (itemId: string, quantity: number, machineId: string | null, sectorId: string | null) => void;
    canEdit: boolean;
    canLogUsage: boolean;
};

// Helper component to find and load the machine
function MachineLoader({ machineId, children }: { machineId: string, children: (machine: Machine) => React.ReactNode }) {
    const firestore = useFirestore();
    const sectorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'sectors') : null, [firestore]);
    const { data: sectors, isLoading: isLoadingSectors } = useCollection<Sector>(sectorsRef);
    const [foundMachine, setFoundMachine] = useState<Machine | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        if (isLoadingSectors || !sectors || !firestore) return;

        let isMounted = true;
        const findMachine = async () => {
            setIsLoading(true);
            for (const sector of sectors) {
                const machineRef = doc(firestore, `sectors/${sector.id}/machines`, machineId);
                const machineSnap = await getDoc(machineRef);
                if (machineSnap.exists() && isMounted) {
                    setFoundMachine({ id: machineSnap.id, ...machineSnap.data() } as Machine);
                    break;
                }
            }
             if(isMounted) setIsLoading(false);
        };

        findMachine();
        return () => { isMounted = false; }
    }, [machineId, sectors, firestore, isLoadingSectors]);

    if (isLoading || isLoadingSectors) {
        return (
            <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!foundMachine) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>No se pudo encontrar la máquina con el ID: {machineId}</p>
                </CardContent>
            </Card>
        );
    }
    
    return <>{children(foundMachine)}</>;
}


function MachineDetails({ machine, allInventory, machineAssignments, onAssignItem, onRemoveItem, onLogUsage, canEdit, canLogUsage }: { machine: Machine, allInventory: InventoryItem[], machineAssignments: MachineAssignment[], onAssignItem: (itemId: string, machineId: string, sectorId: string, quantity: number) => void, onRemoveItem: (assignmentId: string) => void, onLogUsage: (itemId: string, quantity: number, machineId: string | null, sectorId: string | null) => void, canEdit: boolean, canLogUsage: boolean }) {
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [logUsageItem, setLogUsageItem] = useState<InventoryItem | null>(null);
    const firestore = useFirestore();

    const sectorRef = useMemoFirebase(() => {
        if (firestore && machine) {
            return doc(firestore, 'sectors', machine.sectorId);
        }
        return null;
    }, [firestore, machine]);
    const { data: sector, isLoading: isSectorLoading } = useDoc<Sector>(sectorRef);

    const assignedItemsDetails = machineAssignments.map(item => {
        const itemDetails = allInventory.find(b => b.id === item.itemId);
        return {
            ...item,
            stock: itemDetails?.stock ?? 'N/A',
            threshold: itemDetails?.threshold ?? 0,
            inventoryItem: itemDetails
        };
    }).sort((a, b) => a.itemName.localeCompare(b.itemName));

    if (isSectorLoading || !sector) {
        return (
             <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <>
            <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle>Artículos en {machine.name}</CardTitle>
                            <CardDescription>
                                Esta es la lista de artículos asignados a esta máquina en el sector {sector.name}.
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
                                    <TableHead className="text-right">Asignado</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedItemsDetails.length > 0 ? (
                                    assignedItemsDetails.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.itemName}</TableCell>
                                            <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{item.stock}</TableCell>
                                            <TableCell className="flex justify-end gap-1">
                                                {canLogUsage && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        disabled={(item.inventoryItem?.stock ?? 0) === 0}
                                                        onClick={() => item.inventoryItem && setLogUsageItem(item.inventoryItem)}
                                                    >
                                                        Usar
                                                    </Button>
                                                )}
                                                {canEdit && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => onRemoveItem(item.id)}
                                                        aria-label={`Quitar ${item.itemName}`}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Aún no se han asignado artículos a esta máquina.
                                        </TableCell>TRow
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
             {logUsageItem && canLogUsage && (
                <UpdateStockDialog
                    key={`log-${logUsageItem.id}`}
                    item={logUsageItem}
                    onClose={() => setLogUsageItem(null)}
                    onConfirm={(itemId, quantity, machineId, sectorId) => onLogUsage(itemId, quantity, machineId, sectorId)}
                    mode="logUsage"
                    sectors={[sector]}
                    machinesBySector={{ [sector.id]: [machine] }}
                    defaultValues={{
                        sectorId: sector.id,
                        machineId: machine.id,
                    }}
                />
            )}
        </>
    );
}

export default function MachineView({ machineId, ...props }: MachineViewProps) {
    return (
        <MachineLoader machineId={machineId}>
            {(machine) => (
                <MachineDetails 
                    machine={machine} 
                    {...props} 
                    machineAssignments={props.machineAssignments.filter(a => a.machineId === machineId)} 
                />
            )}
        </MachineLoader>
    );
}
