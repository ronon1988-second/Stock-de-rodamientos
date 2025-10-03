"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Home,
  LineChart,
  Menu,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bearing, UsageLog } from "@/lib/types";
import { initialBearings } from "@/lib/data";
import Dashboard from "@/components/app/dashboard";
import Reports from "@/components/app/reports";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/app/logo";

type View = "dashboard" | "reports";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [bearings, setBearings] = useState<Bearing[]>(initialBearings);
  const [usageLog, setUsageLog] = useState<UsageLog[]>([]);
  const { toast } = useToast();

  const handleAddBearing = (newBearing: Omit<Bearing, "id">) => {
    // This function is kept for compatibility but might be phased out
    // as the new workflow is to update existing bearings from the master list.
    const bearingWithId: Bearing = {
      ...newBearing,
      id: `b${(bearings.length + 1).toString().padStart(3, '0')}`,
    };
    setBearings(prev => [...prev, bearingWithId]);
    toast({
        title: "Rodamiento Añadido",
        description: `Se ha añadido ${newBearing.name} al inventario.`
    });
  };

  const handleUpdateBearing = (updatedBearing: Bearing) => {
    setBearings(prev => prev.map(b => b.id === updatedBearing.id ? updatedBearing : b));
     toast({
        title: "Rodamiento Actualizado",
        description: `Se ha actualizado el stock de ${updatedBearing.name}.`
    });
  }

  const handleLogUsage = (bearingId: string, quantity: number, sector: Bearing['sector']) => {
    let updatedBearing: Bearing | undefined;
    setBearings((prevBearings) =>
      prevBearings.map((bearing) => {
        if (bearing.id === bearingId) {
          if (bearing.stock < quantity) {
             toast({
              variant: "destructive",
              title: "Error de Stock",
              description: `No hay suficiente stock para ${bearing.name}.`,
            });
            updatedBearing = bearing; // Keep it as is
            return bearing;
          }
          updatedBearing = { ...bearing, stock: bearing.stock - quantity };
          return updatedBearing;
        }
        return bearing;
      })
    );
    
    // This part runs only if the stock was sufficient
    if (updatedBearing && updatedBearing.stock >= 0) {
      const newLog: UsageLog = {
        id: `usage-${Date.now()}`,
        bearingId: bearingId,
        bearingName: updatedBearing.name,
        quantity,
        date: new Date().toISOString(),
        sector: sector,
      };
      setUsageLog((prevLogs) => [newLog, ...prevLogs]);

      toast({
        title: "Uso Registrado",
        description: `Se han usado ${quantity} unidades de ${updatedBearing.name} en ${sector}.`
      });

      if (
        updatedBearing.stock <= updatedBearing.threshold &&
        (updatedBearing.stock + quantity) > updatedBearing.threshold
      ) {
        toast({
          variant: "destructive",
          title: "Alerta de Stock Bajo",
          description: `El rodamiento ${updatedBearing.name} ha entrado en nivel de stock bajo.`,
        });
      }
    }
  };

  const lowStockCount = bearings.filter(
    (b) => b.stock <= b.threshold && b.stock > 0
  ).length;

  const NavLink = ({
    targetView,
    icon,
    label,
    badgeCount,
  }: {
    targetView: View;
    icon: React.ReactNode;
    label: string;
    badgeCount?: number;
  }) => (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setView(targetView);
      }}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
        view === targetView ? "bg-muted text-primary" : ""
      }`}
    >
      {icon}
      {label}
      {badgeCount !== undefined && badgeCount > 0 && (
        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {badgeCount}
        </Badge>
      )}
    </a>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <a href="/" className="flex items-center gap-2 font-semibold">
              <Logo className="h-8 w-8 text-primary" />
              <span className="">Balance de Rodamientos</span>
            </a>
            {lowStockCount > 0 && (
              <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Alternar notificaciones</span>
              </Button>
            )}
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLink
                targetView="dashboard"
                icon={<Home className="h-4 w-4" />}
                label="Panel de control"
              />
              <NavLink
                targetView="reports"
                icon={<LineChart className="h-4 w-4" />}
                label="Reportes"
              />
            </nav>
          </div>
           <div className="mt-auto p-4">
            <Card x-chunk="dashboard-02-chunk-0">
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>¿Necesitas Ayuda?</CardTitle>
                <CardDescription>
                  Contacta a soporte si tienes problemas o quieres nuevas funcionalidades.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  Contactar a Soporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Alternar menú de navegación</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <a
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Logo className="h-8 w-8 text-primary" />
                  <span className="sr-only">Balance de Rodamientos</span>
                </a>
                <NavLink
                  targetView="dashboard"
                  icon={<Home className="h-5 w-5" />}
                  label="Panel de control"
                />
                <NavLink
                  targetView="reports"
                  icon={<LineChart className="h-5 w-5" />}
                  label="Reportes"
                />
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
             <h1 className="font-semibold text-xl capitalize">{view === 'dashboard' ? 'Panel de control' : 'Reportes'}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                 <img src="https://images.unsplash.com/photo-1628157588553-5ee30a682e5e?q=80&w=200&h=200&auto=format&fit=crop" alt="Avatar" className="rounded-full" />
                <span className="sr-only">Alternar menú de usuario</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuItem>Soporte</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {view === "dashboard" && (
            <Dashboard
              bearings={bearings}
              usageLog={usageLog}
              onLogUsage={handleLogUsage}
              onAddBearing={handleAddBearing}
              onUpdateBearing={handleUpdateBearing}
            />
          )}
          {view === "reports" && (
            <Reports bearings={bearings} usageLog={usageLog} />
          )}
        </main>
      </div>
    </div>
  );
}
