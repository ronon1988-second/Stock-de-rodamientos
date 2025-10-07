
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { UsageLog, Sector, Machine } from "@/lib/types";
import UsageChart from "./usage-chart";
import { useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";

type ReportsProps = {
  usageLog: UsageLog[];
  sectors: Sector[];
};

export default function Reports({ usageLog, sectors }: ReportsProps) {
  const firestore = useFirestore();

  const machinesBySector = useMemo(() => {
    const machineListeners: Record<string, Machine[]> = {};
    sectors.forEach(sector => {
      // This is not ideal inside useMemo, but we'll create a dedicated component for listening
      const machinesQuery = firestore ? query(collection(firestore, `sectors/${sector.id}/machines`)) : null;
      // In a real app you'd use a hook here, but for this structure we'll just prep the object
      machineListeners[sector.id] = []; 
    });
    return machineListeners;
  }, [sectors, firestore]);

  const getMachineAndSectorName = (machineId: string, sectorId: string) => {
    const sector = sectors.find(s => s.id === sectorId);
    // This is inefficient; a better data structure would be a map.
    // For now, this will work for display purposes.
    const machineName = 'Desconocida';
    return {
      sectorName: sector?.name ?? 'Desconocido',
      machineName: machineName,
    }
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Uso por Sector</CardTitle>
          <CardDescription>
            Representación visual del consumo de artículos por sector.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsageChart usageData={usageLog} sectors={sectors} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Historial de Uso</CardTitle>
          <CardDescription>Un registro detallado de todo el uso de artículos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artículo</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageLog.length > 0 ? (
                usageLog.map((log) => {
                  const { sectorName } = getMachineAndSectorName(log.machineId, log.sectorId);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.itemName}
                      </TableCell>
                      <TableCell>{sectorName}</TableCell>
                      <TableCell className="text-right">{log.quantity}</TableCell>
                      <TableCell>
                        {format(new Date(log.date), "PPP p", { locale: es })}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No hay datos de uso disponibles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    