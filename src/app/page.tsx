
"use client";

import React, { useState, useMemo } from "react";
import {
  Home,
  LineChart,
  Menu,
  ChevronRight,
  ShoppingCart,
  Package,
  User,
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InventoryItem, UsageLog, Sector, SECTORS, SectorAssignment } from "@/lib/types";
import { initialInventory, initialSectorAssignments } from "@/lib/data";
import Dashboard from "@/components/app/dashboard";
import Reports from "@/components/app/reports";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/app/logo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SectorView from "@/components/app/sector-view";
import ToBuyView from "@/components/app/to-buy-view";

type View = "dashboard" | "reports" | "to-buy" | `sector-${Sector}`;

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [usageLog, setUsageLog] = useState<UsageLog[]>([]);
  const [sectorAssignments, setSectorAssignments] = useState<SectorAssignment[]>(initialSectorAssignments);
  const { toast } = useToast();
  const [isSectorsOpen, setIsSectorsOpen] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);


  const handleAddItem = (newItem: Omit<InventoryItem, 'id'>) => {
    setInventory(prev => {
        const newCompleteItem: InventoryItem = {
            ...newItem,
            id: `item-${Date.now()}-${Math.random()}`
        };
        return [...prev, newCompleteItem];
    });
    toast({
        title: "Artículo Agregado",
        description: `Se ha agregado ${newItem.name} al inventario.`
    });
  }

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(b => b.id === updatedItem.id ? updatedItem : b));
     toast({
        title: "Artículo Actualizado",
        description: `Se ha actualizado el stock de ${updatedItem.name}.`
    });
  }

  const handleAssignItemToSector = (itemId: string, sector: Sector, quantity: number) => {
    const item = inventory.find(b => b.id === itemId);
    if (!item) return;

    setSectorAssignments(prevAssignments => {
      const existingAssignment = prevAssignments.find(
        i => i.sector === sector && i.itemId === itemId
      );

      if (existingAssignment) {
        // If it exists, update the quantity
        return prevAssignments.map(i =>
          i.id === existingAssignment.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        // If it doesn't exist, add a new assignment
        const newAssignment: SectorAssignment = {
          id: `si-${Date.now()}`,
          sector,
          itemId,
          itemName: item.name,
          quantity: quantity
        };
        return [...prevAssignments, newAssignment];
      }
    });

    toast({
      title: "Artículo Asignado",
      description: `Se han asignado ${quantity} unidades de ${item.name} al sector ${sector}.`,
    });
  };

  const handleRemoveItemFromSector = (assignmentId: string) => {
    const assignment = sectorAssignments.find(item => item.id === assignmentId);
    if (!assignment) return;

    setSectorAssignments(prev => prev.filter(item => item.id !== assignmentId));
    toast({
      title: "Asignación Eliminada",
      description: `Se ha quitado el artículo ${assignment.itemName} del sector ${assignment.sector}.`,
    });
  };

  const handleLogUsage = (itemId: string, quantity: number, sector: Sector) => {
    let updatedItem: InventoryItem | undefined;
    setInventory((prevInventory) =>
      prevInventory.map((item) => {
        if (item.id === itemId) {
          if (item.stock < quantity) {
             toast({
              variant: "destructive",
              title: "Error de Stock",
              description: `No hay suficiente stock para ${item.name}.`,
            });
            updatedItem = item; // Keep it as is
            return item;
          }
          updatedItem = { ...item, stock: item.stock - quantity };
          return updatedItem;
        }
        return item;
      })
    );
    
    const originalStock = inventory.find(b => b.id === itemId)?.stock;
    if (updatedItem && originalStock && updatedItem.stock < originalStock) {
      const newLog: UsageLog = {
        id: `usage-${Date.now()}`,
        itemId: itemId,
        itemName: updatedItem.name,
        quantity,
        date: new Date().toISOString(),
        sector: sector,
      };
      setUsageLog((prevLogs) => [newLog, ...prevLogs]);

      toast({
        title: "Uso Registrado",
        description: `Se han usado ${quantity} unidades de ${updatedItem.name} en ${sector}.`
      });

      if (
        updatedItem.stock <= updatedItem.threshold &&
        (updatedItem.stock + quantity) > updatedItem.threshold
      ) {
        toast({
          variant: "destructive",
          title: "Alerta de Stock Bajo",
          description: `El artículo ${updatedItem.name} ha entrado en nivel de stock bajo.`,
        });
      }
    }
  };

  const lowStockCount = useMemo(() => {
    const requiredBySector: { [itemId: string]: number } = {};
    sectorAssignments.forEach(item => {
        if (!requiredBySector[item.itemId]) {
            requiredBySector[item.itemId] = 0;
        }
        requiredBySector[item.itemId] += item.quantity;
    });

    return inventory.filter(b => {
        const totalRequired = requiredBySector[b.id] || 0;
        const safetyStock = b.threshold;
        const totalDemand = totalRequired + safetyStock;
        return b.stock < totalDemand;
    }).length;
  }, [inventory, sectorAssignments]);

  const NavLink = ({
    targetView,
    icon,
    label,
    badgeCount,
    isSubItem = false,
    onClick,
  }: {
    targetView: View;
    icon: React.ReactNode;
    label: string;
    badgeCount?: number;
    isSubItem?: boolean;
    onClick: (view: View) => void;
  }) => (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick(targetView);
      }}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
        view === targetView ? "bg-muted text-primary" : ""
      } ${isSubItem ? 'pl-7' : ''}`}
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
  
  const getViewTitle = () => {
    if (view === 'dashboard') return 'Panel de control';
    if (view === 'reports') return 'Reportes';
    if (view === 'to-buy') return 'Artículos a Comprar';
    if (view.startsWith('sector-')) {
        const sector = view.replace('sector-', '');
        return `Sector: ${sector}`;
    }
    return 'Panel de control';
  }

  const renderContent = () => {
    if (view === 'dashboard') {
      return <Dashboard
        inventory={inventory}
        onLogUsage={handleLogUsage}
        onUpdateItem={handleUpdateItem}
        onAddItem={handleAddItem}
      />
    }
    if (view === 'reports') {
      return <Reports usageLog={usageLog} />
    }
    if (view === 'to-buy') {
        return <ToBuyView inventory={inventory} sectorAssignments={sectorAssignments}/>
    }
    if (view.startsWith('sector-')) {
        const sector = view.replace('sector-', '') as Sector;
        return <SectorView 
            sector={sector} 
            allInventory={inventory} 
            sectorAssignments={sectorAssignments.filter(item => item.sector === sector)}
            onAssignItem={handleAssignItemToSector}
            onRemoveItem={handleRemoveItemFromSector}
        />
    }
    return null;
  }

  const handleNavClick = (targetView: View) => {
    setView(targetView);
    setIsSheetOpen(false); // Close sheet on navigation
  };

  const MainNav = ({ isMobile = false }) => (
     <nav className={`grid items-start ${isMobile ? 'gap-2 text-lg' : 'px-2 text-sm'} font-medium ${isMobile ? '' : 'lg:px-4'}`}>
      <NavLink
        targetView="dashboard"
        icon={<Home className={isMobile ? "h-5 w-5" : "h-4 w-4"} />}
        label="Panel de control"
        onClick={handleNavClick}
      />
      <Collapsible open={isSectorsOpen} onOpenChange={setIsSectorsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary [&[data-state=open]>div>svg.chevron]:rotate-90">
              <div className="flex items-center gap-3">
                  <Package className={isMobile ? "h-5 w-5" : "h-4 w-4"}/>
                  <span>Sectores</span>
              </div>
              <ChevronRight className="chevron h-4 w-4 transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-1">
              {SECTORS.map(sector => (
                  <NavLink
                      key={sector}
                      targetView={`sector-${sector}`}
                      icon={<div className="h-4 w-4" />} // Placeholder for alignment
                      label={sector}
                      isSubItem={true}
                      onClick={handleNavClick}
                  />
              ))}
          </CollapsibleContent>
      </Collapsible>

      <NavLink
        targetView="to-buy"
        icon={<ShoppingCart className={isMobile ? "h-5 w-5" : "h-4 w-4"} />}
        label="Artículos a Comprar"
        badgeCount={lowStockCount}
        onClick={handleNavClick}
      />
      <NavLink
        targetView="reports"
        icon={<LineChart className={isMobile ? "h-5 w-5" : "h-4 w-4"} />}
        label="Reportes"
        onClick={handleNavClick}
      />
    </nav>
  )

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <a href="/" className="flex items-center gap-2 font-semibold">
              <Logo className="h-8 w-8 text-primary" />
              <span className="">Balance de Rodamientos</span>
            </a>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <MainNav />
          </div>
           <div className="mt-auto p-4">
            <Card>
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
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
                <SheetHeader>
                  <SheetTitle className="sr-only">Menú</SheetTitle>
                </SheetHeader>
              <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Logo className="h-8 w-8 text-primary" />
                <span>Balance de Rodamientos</span>
              </div>
              <MainNav isMobile={true} />
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
             <h1 className="font-semibold text-xl capitalize">{getViewTitle()}</h1>
          </div>
          <Button variant="secondary" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
            <span className="sr-only">Perfil de usuario</span>
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

