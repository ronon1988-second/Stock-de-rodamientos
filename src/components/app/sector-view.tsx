"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bearing, Sector, UsageLog } from '@/lib/types';
import { Package } from 'lucide-react';
import UsageChart from './usage-chart';

type SectorViewProps = {
    sector: Sector;
    allBearings: Bearing[];
    usageLog: UsageLog[];
};

export default function SectorView({ sector, allBearings, usageLog }: SectorViewProps) {
    // Filter usage logs for the current sector
    const sectorUsage = usageLog.filter(log => log.sector === sector);

    // Aggregate bearings and their quantities used in this sector
    const bearingsInSector = sectorUsage.reduce((acc, log) => {
        if (!acc[log.bearingName]) {
            acc[log.bearingName] = { 
                ...allBearings.find(b => b.name === log.bearingName)!, 
                quantityUsed: 0 
            };
        }
        acc[log.bearingName].quantityUsed += log.quantity;
        return acc;
    }, {} as { [key: string]: Bearing & { quantityUsed: number } });

    const bearingsArray = Object.values(bearingsInSector).sort((a, b) => a.name.localeCompare(b.name));

    const totalUsageInSector = sectorUsage.reduce((sum, log) => sum + log.quantity, 0);

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <div className="grid gap-4 sm:grid-cols-2">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Uso Total en Sector</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsageInSector}</div>
                        <p className="text-xs text-muted-foreground">Unidades totales usadas aquí</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tipos de Rodamiento Usados</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bearingsArray.length}</div>
                        <p className="text-xs text-muted-foreground">Códigos únicos en este sector</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Rodamientos Usados en {sector}</CardTitle>
                    <CardDescription>
                        Esta es una lista de todos los rodamientos que se han registrado en este sector.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rodamiento</TableHead>
                                <TableHead className="text-right">Cantidad Usada</TableHead>
                                <TableHead className="text-right">Stock General Actual</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bearingsArray.length > 0 ? (
                                bearingsArray.map(bearing => (
                                    <TableRow key={bearing.id}>
                                        <TableCell className="font-medium">{bearing.name}</TableCell>
                                        <TableCell className="text-right">{bearing.quantityUsed}</TableCell>
                                        <TableCell className="text-right">{bearing.stock}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No se ha registrado el uso de rodamientos en este sector aún.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                  <CardTitle>Gráfico de Uso del Sector</CardTitle>
                  <CardDescription>
                    Consumo de los rodamientos más usados en {sector}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsageChart usageData={sectorUsage} />
                </CardContent>
            </Card>
        </div>
    );
}
