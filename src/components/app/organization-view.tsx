
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Trash2, Edit, Save, X } from 'lucide-react';
import { Sector, Machine } from '@/lib/types';
import { Firestore, collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Skeleton } from '../ui/skeleton';

type OrganizationViewProps = {
    sectors: Sector[];
    firestore: Firestore;
};

function MachineListEditor({ sector }: { sector: Sector }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [newMachineName, setNewMachineName] = useState('');
    const [editingMachine, setEditingMachine] = useState<{ id: string, name: string } | null>(null);

    const machinesRef = useMemoFirebase(() => collection(firestore, `sectors/${sector.id}/machines`), [firestore, sector.id]);
    const { data: machines, isLoading } = useCollection<Machine>(machinesRef);

    const handleAddMachine = () => {
        const machineName = newMachineName.trim();
        if (!machineName) return;
        const machinesRef = collection(firestore, `sectors/${sector.id}/machines`);
        addDocumentNonBlocking(machinesRef, { name: machineName, sectorId: sector.id });
        setNewMachineName('');
        toast({ title: "Máquina Agregada", description: `Se ha agregado la máquina "${machineName}".` });
    };

    const handleDeleteMachine = (machine: Machine) => {
        const machineRef = doc(firestore, `sectors/${sector.id}/machines`, machine.id);
        deleteDocumentNonBlocking(machineRef);
        toast({ title: "Máquina Eliminada", variant: 'destructive', description: `Se ha eliminado la máquina "${machine.name}".` });
    };

    const handleUpdateMachine = () => {
        if (!editingMachine || editingMachine.name.trim() === '') return;
        const machineRef = doc(firestore, `sectors/${sector.id}/machines`, editingMachine.id);
        updateDocumentNonBlocking(machineRef, { name: editingMachine.name });
        toast({ title: "Máquina Actualizada", description: "El nombre de la máquina ha sido actualizado." });
        setEditingMachine(null);
    };

    if (isLoading) {
        return (
            <div className="pl-4 space-y-2">
                <Skeleton className="h-10 w-full"/>
                <Skeleton className="h-8 w-3/4"/>
                <Skeleton className="h-8 w-1/2"/>
            </div>
        )
    }

    return (
        <div className="pl-4">
            <div className="flex gap-2 my-4">
                <Input
                    placeholder="Nombre de la nueva máquina"
                    value={newMachineName}
                    onChange={e => setNewMachineName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMachine()}
                />
                <Button variant="outline" onClick={handleAddMachine}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Máquina
                </Button>
            </div>
            <div className="space-y-2">
                {(machines || []).sort((a, b) => a.name.localeCompare(b.name)).map(machine => (
                    <div key={machine.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        {editingMachine?.id === machine.id ? (
                            <div className="flex items-center gap-2 flex-grow" onClick={(e) => e.stopPropagation()}>
                                <Input
                                    value={editingMachine.name}
                                    onChange={(e) => setEditingMachine({ ...editingMachine, name: e.target.value })}
                                    className="h-8"
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateMachine()}
                                />
                                <Button size="icon" className="h-8 w-8" onClick={handleUpdateMachine}><Save className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingMachine(null)}><X className="h-4 w-4" /></Button>
                            </div>
                        ) : (
                           <div className="flex-grow flex items-center">
                             <span>{machine.name}</span>
                             <div className="ml-auto flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setEditingMachine({ id: machine.id, name: machine.name })}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. Esto eliminará permanentemente la máquina y sus asignaciones.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteMachine(machine)}>Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                           </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function OrganizationView({ sectors, firestore }: OrganizationViewProps) {
    const [newSectorName, setNewSectorName] = useState('');
    const [editingSector, setEditingSector] = useState<{id: string, name: string} | null>(null);
    const { toast } = useToast();

    const handleAddSector = () => {
        if (newSectorName.trim() === '') return;
        const sectorsRef = collection(firestore, 'sectors');
        addDocumentNonBlocking(sectorsRef, { name: newSectorName });
        setNewSectorName('');
        toast({ title: "Sector Agregado", description: `Se ha creado el sector "${newSectorName}".` });
    };

    const handleDeleteSector = (sector: Sector) => {
        const sectorRef = doc(firestore, 'sectors', sector.id);
        deleteDocumentNonBlocking(sectorRef);
        // Note: Machines subcollection is not automatically deleted, but will be inaccessible.
        // A real-world app might need a cloud function to clean up subcollections.
        toast({ title: "Sector Eliminado", variant: 'destructive', description: `Se ha eliminado el sector "${sector.name}".` });
    };

    const handleUpdateSector = () => {
        if (!editingSector || editingSector.name.trim() === '') return;
        const sectorRef = doc(firestore, 'sectors', editingSector.id);
        updateDocumentNonBlocking(sectorRef, { name: editingSector.name });
        toast({ title: "Sector Actualizado", description: "El nombre del sector ha sido actualizado."});
        setEditingSector(null);
    };

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Gestionar Organización</CardTitle>
                    <CardDescription>
                        Agregue, edite o elimine sectores y las máquinas que pertenecen a cada uno.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-6">
                        <Input 
                            placeholder="Nombre del nuevo sector" 
                            value={newSectorName} 
                            onChange={(e) => setNewSectorName(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSector()}
                        />
                        <Button onClick={handleAddSector}><PlusCircle className="mr-2 h-4 w-4"/> Agregar Sector</Button>
                    </div>

                    <Accordion type="multiple" className="w-full">
                        {sectors.map(sector => (
                            <AccordionItem key={sector.id} value={sector.id}>
                                <div className="flex items-center justify-between w-full border-b">
                                    {editingSector?.id === sector.id ? (
                                        <div className="flex items-center gap-2 flex-grow p-4" onClick={(e) => e.stopPropagation()}>
                                            <Input 
                                                value={editingSector.name}
                                                onChange={(e) => setEditingSector({...editingSector, name: e.target.value})}
                                                className="h-8"
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateSector()}
                                            />
                                            <Button size="icon" className="h-8 w-8" onClick={handleUpdateSector}><Save className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingSector(null)}><X className="h-4 w-4"/></Button>
                                        </div>
                                    ) : (
                                        <>
                                            <AccordionTrigger className="flex-1 py-4 pr-2 text-left">
                                                <span className="font-semibold text-lg">{sector.name}</span>
                                            </AccordionTrigger>
                                             <div className="flex items-center gap-1 pr-4" onClick={e => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" onClick={() => setEditingSector({id: sector.id, name: sector.name})}>
                                                    <Edit className="h-4 w-4"/>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                         <Button variant="ghost" size="icon">
                                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Esto eliminará permanentemente el sector y todas las máquinas asociadas.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteSector(sector)}>Eliminar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <AccordionContent>
                                   <MachineListEditor sector={sector} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}

    