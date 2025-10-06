
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Home,
  LineChart,
  Menu,
  ChevronRight,
  ShoppingCart,
  Package,
  User,
  LogOut,
} from "lucide-react";
import {
  collection,
  doc,
  writeBatch,
  getDocs,
} from "firebase/firestore";

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
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

type View = "dashboard" | "reports" | "to-buy" | `sector-${Sector}`;

function AppContent() {
  const [view, setView] = useState<View>("dashboard");
  const { toast } = useToast();
  const [isSectorsOpen, setIsSectorsOpen] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSeeding, setIsSeeding] = useState(false);
  
  // --- Firestore Data Hooks ---
  const inventoryRef = useMemoFirebase(() => collection(firestore, "inventory"), [firestore]);
  const { data: inventory, isLoading: isInventoryLoading } = useCollection<Omit<InventoryItem, 'id'>>(inventoryRef);

  const sectorAssignmentsRef = useMemoFirebase(() => collection(firestore, "sectorAssignments"), [firestore]);
  const { data: sectorAssignments, isLoading: isAssignmentsLoading } = useCollection<Omit<SectorAssignment, 'id'>>(sectorAssignmentsRef);

  const usageLogRef = useMemoFirebase(() => collection(firestore, "usageLog"), [firestore]);
  const { data: usageLog, isLoading: isUsageLogLoading } = useCollection<Omit<UsageLog, 'id'>>(usageLogRef);

  // Effect to seed initial data if collections are empty
  useEffect(() => {
    const seedData = async () => {
      if (inventory === null || sectorAssignments === null) return;
      if (inventory.length === 0 && sectorAssignments.length === 0) {
        setIsSeeding(true);
        toast({
          title: "Cargando datos iniciales...",
          description: "Por favor espere. Esto puede tardar un momento.",
        });
        const batch = writeBatch(firestore);

        const invRef = collection(firestore, "inventory");
        initialInventory.forEach(item => {
            const { id, ...data } = item;
            const docRef = doc(invRef, id);
            batch.set(docRef, data);
        });

        const assignRef = collection(firestore, "sectorAssignments");
        initialSectorAssignments.forEach(item => {
            const { id, ...data } = item;
            const docRef = doc(assignRef, id);
            batch.set(docRef, data);
        });
        
        try {
          await batch.commit();
          toast({
            title: "Datos cargados",
            description: "El inventario inicial se ha cargado correctamente.",
          });
        } catch (error) {
          console.error("Error seeding data: ", error);
          toast({
            variant: "destructive",
            title: "Error al cargar datos",
            description: "No se pudo cargar el inventario inicial.",
          });
        } finally {
            setIsSeeding(false);
        }
      }
    };
    seedData();
  }, [inventory, sectorAssignments, firestore, toast]);

  const sortedInventory = useMemo(() => inventory ? [...inventory].sort((a, b) => a.name.localeCompare(b.name)) : [], [inventory]);
  const sortedAssignments = useMemo(() => sectorAssignments ? [...sectorAssignments] : [], [sectorAssignments]);
  const sortedUsageLog = useMemo(() => usageLog ? [...usageLog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [], [usageLog]);

  const handleAddItem = (newItem: Omit<InventoryItem, 'id'>) => {
    const invRef = collection(firestore, "inventory");
    addDocumentNonBlocking(invRef, newItem);
    toast({
        title: "Artículo Agregado",
        description: `Se ha agregado ${newItem.name} al inventario.`
    });
  }

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    const itemRef = doc(firestore, "inventory", updatedItem.id);
    const { id, ...data } = updatedItem;
    updateDocumentNonBlocking(itemRef, data);
     toast({
        title: "Artículo Actualizado",
        description: `Se ha actualizado el stock de ${updatedItem.name}.`
    });
  }

  const handleAssignItemToSector = (itemId: string, sector: Sector, quantity: number) => {
    if (!inventory) return;
    const item = inventory.find(b => b.id === itemId);
    if (!item) return;

    const assignRef = collection(firestore, "sectorAssignments");
    
    const newAssignment: Omit<SectorAssignment, 'id'> = {
      sector,
      itemId,
      itemName: item.name,
      quantity: quantity
    };

    addDocumentNonBlocking(assignRef, newAssignment);

    toast({
      title: "Artículo Asignado",
      description: `Se han asignado ${quantity} unidades de ${item.name} al sector ${sector}.`,
    });
  };

  const handleRemoveItemFromSector = (assignmentId: string) => {
    const assignment = sectorAssignments?.find(item => item.id === assignmentId);
    if (!assignment) return;

    const assignRef = doc(firestore, "sectorAssignments", assignmentId);
    deleteDocumentNonBlocking(assignRef);

    toast({
      title: "Asignación Eliminada",
      description: `Se ha quitado el artículo ${assignment.itemName} del sector ${assignment.sector}.`,
    });
  };

  const handleLogUsage = (itemId: string, quantity: number, sector: Sector) => {
    if (!inventory) return;
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    if (item.stock < quantity) {
      toast({
        variant: "destructive",
        title: "Error de Stock",
        description: `No hay suficiente stock para ${item.name}.`,
      });
      return;
    }
    
    // Update inventory stock
    const updatedStock = item.stock - quantity;
    const itemRef = doc(firestore, "inventory", itemId);
    updateDocumentNonBlocking(itemRef, { stock: updatedStock });
    
    // Create usage log
    const newLog: Omit<UsageLog, 'id'> = {
      itemId: itemId,
      itemName: item.name,
      quantity,
      date: new Date().toISOString(),
      sector: sector,
    };
    const usageLogRef = collection(firestore, "usageLog");
    addDocumentNonBlocking(usageLogRef, newLog);

    toast({
      title: "Uso Registrado",
      description: `Se han usado ${quantity} unidades de ${item.name} en ${sector}.`
    });

    if (
      updatedStock <= item.threshold &&
      (item.stock) > item.threshold
    ) {
      toast({
        variant: "destructive",
        title: "Alerta de Stock Bajo",
        description: `El artículo ${item.name} ha entrado en nivel de stock bajo.`,
      });
    }
  };

  const lowStockCount = useMemo(() => {
    if (!inventory || !sectorAssignments) return 0;
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

  const handleLogout = async () => {
    await auth.signOut();
    toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente.",
    })
  };

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
    const isLoading = isInventoryLoading || isAssignmentsLoading || isUsageLogLoading || isSeeding;
     if (isLoading) {
        return <Skeleton className="h-full w-full" />
    }

    if (view === 'dashboard') {
      return <Dashboard
        inventory={sortedInventory}
        onLogUsage={handleLogUsage}
        onUpdateItem={handleUpdateItem}
        onAddItem={handleAddItem}
      />
    }
    if (view === 'reports') {
      return <Reports usageLog={sortedUsageLog} />
    }
    if (view === 'to-buy') {
        return <ToBuyView inventory={sortedInventory} sectorAssignments={sortedAssignments}/>
    }
    if (view.startsWith('sector-')) {
        const sector = view.replace('sector-', '') as Sector;
        return <SectorView 
            sector={sector} 
            allInventory={sortedInventory} 
            sectorAssignments={sortedAssignments.filter(item => item.sector === sector)}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Perfil de usuario</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-[95vh] w-[95vw] rounded-lg" />
      </div>
    );
  }

  return <AppContent />;
}
