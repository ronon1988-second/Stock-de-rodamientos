
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

type ReportsProps = {
  usageLog: UsageLog[];
  sectors: Sector[];
  machinesBySector: MachinesBySector;
};

export default function Reports({ usageLog, sectors, machinesBySector }: ReportsProps) {
  
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

    