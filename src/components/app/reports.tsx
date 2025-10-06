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
import type { UsageLog } from "@/lib/types";
import UsageChart from "./usage-chart";

type ReportsProps = {
  usageLog: UsageLog[];
};

export default function Reports({ usageLog }: ReportsProps) {
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
          <UsageChart usageData={usageLog} />
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
                usageLog.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.itemName}
                    </TableCell>
                    <TableCell>{log.sector}</TableCell>
                    <TableCell className="text-right">{log.quantity}</TableCell>
                    <TableCell>
                      {format(new Date(log.date), "PPP p", { locale: es })}
                    </TableCell>
                  </TableRow>
                ))
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
