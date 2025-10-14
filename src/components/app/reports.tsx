
"use client";
import React, { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import type { UsageLog, Sector, MachinesBySector } from "@/lib/types";
import UsageChart from "./usage-chart";
import { Calendar as CalendarIcon, FileBarChart2, Trash2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ReportsProps = {
  allUsageLogs: UsageLog[];
  sectors: Sector[];
  machinesBySector: MachinesBySector;
  onClearLogs: () => void;
  canClearLogs: boolean;
};

export default function Reports({
  allUsageLogs,
  sectors,
  machinesBySector,
  onClearLogs,
  canClearLogs,
}: ReportsProps) {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [filteredLogs, setFilteredLogs] = useState<UsageLog[] | null>(null);

  const getMachineAndSectorName = (machineId: string, sectorId: string) => {
    if (sectorId === "general" || machineId === "general") {
      return { sectorName: "Uso General", machineName: "No especificado" };
    }
    const sector = sectors.find((s) => s.id === sectorId);
    const machines = machinesBySector[sectorId] || [];
    const machine = machines.find((m) => m.id === machineId);

    return {
      sectorName: sector?.name ?? "Desconocido",
      machineName: machine?.name ?? "Desconocida",
    };
  };

  const handleGenerateReport = () => {
    let logs = allUsageLogs;

    // Filter by date range
    if (date?.from) {
      logs = logs.filter((log) => {
        const logDate = new Date(log.date);
        const fromDate = date.from!;
        // If 'to' is not selected, use 'from' as a single day filter
        const toDate = date.to ? date.to : date.from!; 
        
        // Adjust dates to ignore time for correct day-to-day comparison
        const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
        const startDay = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        const endDay = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());

        return logDay >= startDay && logDay <= endDay;
      });
    }

    // Filter by sector
    if (selectedSector !== "all") {
      logs = logs.filter((log) => log.sectorId === selectedSector);
    }
    
    setFilteredLogs(logs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const handleClearFilters = () => {
    setDate(undefined);
    setSelectedSector("all");
    setFilteredLogs(null);
  };
  
  const hasActiveFilters = date !== undefined || selectedSector !== "all";

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Generador de Reportes</CardTitle>
          <CardDescription>
            Filtre el historial de uso por rango de fechas y sector para
            generar un reporte personalizado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-end">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range Picker */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Rango de Fechas</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal w-full",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                            {format(date.to, "LLL dd, y", { locale: es })}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y", { locale: es })
                        )
                      ) : (
                        <span>Seleccione un rango</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Sector Selector */}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Sector</label>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione un sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Sectores</SelectItem>
                    <SelectItem value="general">Uso General</SelectItem>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end justify-start sm:justify-end">
              <div className="flex gap-2">
                <Button onClick={handleGenerateReport}>
                  <FileBarChart2 className="mr-2 h-4 w-4" />
                  Generar Reporte
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Limpiar
                  </Button>
                )}
              </div>
              
              {/* Clear Logs Button */}
              {canClearLogs && (
                <div className="mt-2 sm:mt-0">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Borrar Historial
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          ¿Está absolutamente seguro?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará
                          permanentemente **todo** el historial de uso. Los
                          niveles de stock no se verán afectados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onClearLogs}>
                          Sí, borrar todo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredLogs && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Uso por Sector</CardTitle>
              <CardDescription>
                Representación visual del consumo de artículos para el período
                y sectores seleccionados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageChart usageData={filteredLogs} sectors={sectors} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Historial de Uso Detallado</CardTitle>
              <CardDescription>
                Un registro detallado del uso de artículos para la selección
                actual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
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
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => {
                        const { sectorName, machineName } =
                          getMachineAndSectorName(log.machineId, log.sectorId);
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {log.itemName}
                            </TableCell>
                            <TableCell>{sectorName}</TableCell>
                            <TableCell>{machineName}</TableCell>
                            <TableCell className="text-right">
                              {log.quantity}
                            </TableCell>
                            <TableCell>
                              {format(new Date(log.date), "PPP p", {
                                locale: es,
                              })}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No hay datos de uso disponibles para los filtros seleccionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
