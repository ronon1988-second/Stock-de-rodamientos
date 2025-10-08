
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
import type { UsageLog, Sector, Machine, MachinesBySector } from "@/lib/types";
import UsageChart from "./usage-chart";
import { useMemo, useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";

// Component to fetch and hold machine data for all sectors
function useAllMachines(sectors: Sector[]) {
  const firestore = useFirestore();
  const [machinesBySector, setMachinesBySector] = useState<MachinesBySector>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || sectors.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchAllMachines = async () => {
      setIsLoading(true);
      const allMachines: MachinesBySector = {};
      await Promise.all(
        sectors.map(async (sector) => {
          const machinesQuery = query(collection(firestore, `sectors/${sector.id}/machines`));
          const machinesSnapshot = await import('firebase/firestore').then(m => m.getDocs(machinesQuery));
          allMachines[sector.id] = machinesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Machine));
        })
      );
      setMachinesBySector(allMachines);
      setIsLoading(false);
    };

    fetchAllMachines();

  }, [firestore, sectors]);

  return { machinesBySector, isLoading };
}


type ReportsProps = {
  usageLog: UsageLog[];
  sectors: Sector[];
};

export default function Reports({ usageLog, sectors }: ReportsProps) {
  const { machinesBySector, isLoading: isLoadingMachines } = useAllMachines(sectors);

  const getMachineAndSectorName = (machineId: string, sectorId: string) => {
    const sector = sectors.find(s => s.id === sectorId);
    const machines = machinesBySector[sectorId] || [];
    const machine = machines.find(m => m.id === machineId);

    return {
      sectorName: sector?.name ?? 'Desconocido',
      machineName: machine?.name ?? 'Desconocida',
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
                <TableHead>Máquina</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageLog.length > 0 ? (
                usageLog.map((log) => {
                  const { sectorName, machineName } = getMachineAndSectorName(log.machineId, log.sectorId);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.itemName}
                      </TableCell>
                      <TableCell>{sectorName}</TableCell>
                       <TableCell>{machineName}</TableCell>
                      <TableCell className="text-right">{log.quantity}</TableCell>
                      <TableCell>
                        {format(new Date(log.date), "PPP p", { locale: es })}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
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
