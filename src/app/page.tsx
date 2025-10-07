
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
  Settings,
  HardDrive,
  Users,
} from "lucide-react";
import {
  collection,
  doc,
  writeBatch,
  query,
  onSnapshot,
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
import { InventoryItem, UsageLog, Sector, Machine, MachineAssignment, UserProfile } from "@/lib/types";
import { initialInventory } from "@/lib/data";
import Dashboard from "@/components/app/dashboard";
import Reports from "@/components/app/reports";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/app/logo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MachineView from "@/components/app/machine-view";
import ToBuyView from "@/components/app/to-buy-view";
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import OrganizationView from "@/components/app/organization-view";
import UserManagementView from "@/components/app/user-management";

type View = "dashboard" | "reports" | "to-buy" | "organization" | "users" | `machine-${string}`;

function AppContent() {
  const [view, setView] = useState<View>("dashboard");
  const { toast } = useToast();
  const [openSectors, setOpenSectors] = useState<string[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSeeding, setIsSeeding] = useState(false);
  
  // --- User Profile and Role ---
  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const userRole = userProfile?.role;
  const isAdmin = userRole === 'admin';

  // --- Firestore Data Hooks ---
  const inventoryRef = useMemoFirebase(() => collection(firestore, "inventory"), [firestore]);
  const { data: inventory, isLoading: isInventoryLoading } = useCollection<Omit<InventoryItem, 'id'>>(inventoryRef);

  const sectorsRef = useMemoFirebase(() => collection(firestore, "sectors"), [firestore]);
  const { data: sectors, isLoading: isSectorsLoading } = useCollection<Omit<Sector, 'id'>>(sectorsRef);

  const [machinesBySector, setMachinesBySector] = useState<Record<string, Machine[]>>({});
  const [areMachinesLoading, setAreMachinesLoading] = useState(true);

  useEffect(() => {
    if (!sectors) {
      setAreMachinesLoading(isSectorsLoading); // Match loading state of sectors
      return;
    }
    if (sectors.length === 0) {
      setAreMachinesLoading(false); // No sectors to load machines from
      return;
    }

    setAreMachinesLoading(true);
    let loadedSectorsCount = 0;

    const unsubscribes = sectors.map(sector => {
      const machinesQuery = query(collection(firestore, `sectors/${sector.id}/machines`));
      
      return onSnapshot(machinesQuery, (snapshot) => {
        const machines = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Machine[];
        setMachinesBySector(prev => ({ ...prev, [sector.id]: machines }));

        // This part handles the initial loading state.
        // It assumes that each onSnapshot will fire at least once on setup.
        if (loadedSectorsCount < sectors.length) {
            loadedSectorsCount++;
            if (loadedSectorsCount === sectors.length) {
                setAreMachinesLoading(false);
            }
        }
      }, (error) => {
        console.error(`Error fetching machines for sector ${sector.id}:`, error);
        // Also count errors as a "loaded" attempt to not block the UI forever
        if (loadedSectorsCount < sectors.length) {
            loadedSectorsCount++;
            if (loadedSectorsCount === sectors.length) {
                setAreMachinesLoading(false);
            }
        }
      });
    });
  
    // Cleanup function
    return () => unsubscribes.forEach(unsub => unsub());

  }, [firestore, sectors, isSectorsLoading]);


  const machineAssignmentsRef = useMemoFirebase(() => collection(firestore, "machineAssignments"), [firestore]);
  const { data: machineAssignments, isLoading: isAssignmentsLoading } = useCollection<Omit<MachineAssignment, 'id'>>(machineAssignmentsRef);

  const usageLogRef = useMemoFirebase(() => collection(firestore, "usageLog"), [firestore]);
  const { data: usageLog, isLoading: isUsageLogLoading } = useCollection<Omit<UsageLog, 'id'>>(usageLogRef);

  // Effect to seed initial data if collections are empty
  useEffect(() => {
    const seedData = async () => {
        // Check if inventory is loaded and is still empty
        if (inventory?.length === 0 && !isInventoryLoading) {
            setIsSeeding(true);
            toast({
                title: "Cargando datos iniciales...",
                description: "Por favor espere. Esto puede tardar un momento.",
            });
            const batch = writeBatch(firestore);
            const invRef = collection(firestore, "inventory");

            // We need to force an update if items exist but stock is not 0
            const existingDocsSnap = await getDocs(invRef);

            if (existingDocsSnap.size > 0) {
                 // If docs exist, update them to have 0 stock
                 existingDocsSnap.forEach(docSnap => {
                     batch.update(docSnap.ref, { stock: 0 });
                 });
            } else {
                // If no docs, seed them from initialInventory
                initialInventory.forEach(item => {
                    const { id, ...data } = item;
                    const docRef = doc(invRef, id);
                    batch.set(docRef, data);
                });
            }
            
            try {
                await batch.commit();
                toast({
                    title: "Datos de inventario listos",
                    description: "El inventario ha sido inicializado correctamente.",
                });
            } catch (error) {
                console.error("Error seeding/updating data: ", error);
                toast({
                    variant: "destructive",
                    title: "Error al preparar datos",
                    description: "No se pudo inicializar el inventario.",
                });
            } finally {
                setIsSeeding(false);
            }
        }
    };
    seedData();
  }, [inventory, isInventoryLoading, firestore, toast]);

  const sortedInventory = useMemo(() => inventory ? [...inventory].sort((a, b) => a.name.localeCompare(b.name)) : [], [inventory]);
  const sortedSectors = useMemo(() => sectors ? [...sectors].sort((a,b) => a.name.localeCompare(b.name)) : [], [sectors]);
  const sortedAssignments = useMemo(() => machineAssignments ? [...machineAssignments] : [], [machineAssignments]);
  const sortedUsageLog = useMemo(() => usageLog ? [...usageLog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [], [usageLog]);

  const handleAddItem = (newItem: Omit<InventoryItem, 'id'>) => {
    if (!isAdmin) return;
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
    setDocumentNonBlocking(itemRef, data, { merge: true });
     toast({
        title: "Artículo Actualizado",
        description: `Se ha actualizado el stock de ${updatedItem.name}.`
    });
  }

  const handleAssignItemToMachine = (itemId: string, machineId: string, sectorId: string, quantity: number) => {
    if (!inventory) return;
    const item = inventory.find(b => b.id === itemId);
    if (!item) return;

    const assignRef = collection(firestore, "machineAssignments");
    
    const newAssignment: Omit<MachineAssignment, 'id'> = {
      sectorId,
      machineId,
      itemId,
      itemName: item.name,
      quantity: quantity
    };

    addDocumentNonBlocking(assignRef, newAssignment);

    toast({
      title: "Artículo Asignado",
      description: `Se han asignado ${quantity} unidades de ${item.name}.`,
    });
  };

  const handleRemoveItemFromMachine = (assignmentId: string) => {
    const assignment = machineAssignments?.find(item => item.id === assignmentId);
    if (!assignment) return;

    const assignRef = doc(firestore, "machineAssignments", assignmentId);
    deleteDocumentNonBlocking(assignRef);

    toast({
      title: "Asignación Eliminada",
      description: `Se ha quitado el artículo ${assignment.itemName}.`,
    });
  };

  const handleLogUsage = (itemId: string, quantity: number, machineId: string, sectorId: string) => {
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
    
    const updatedStock = item.stock - quantity;
    const itemRef = doc(firestore, "inventory", itemId);
    setDocumentNonBlocking(itemRef, { stock: updatedStock }, { merge: true });
    
    const newLog: Omit<UsageLog, 'id'> = {
      itemId,
      itemName: item.name,
      quantity,
      date: new Date().toISOString(),
      sectorId,
      machineId,
    };
    const usageLogRef = collection(firestore, "usageLog");
    addDocumentNonBlocking(usageLogRef, newLog);

    toast({
      title: "Uso Registrado",
      description: `Se han usado ${quantity} unidades de ${item.name}.`
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
    if (!inventory || !machineAssignments) return 0;
    const requiredByItem: { [itemId: string]: number } = {};
    machineAssignments.forEach(item => {
        if (!requiredByItem[item.itemId]) {
            requiredByItem[item.itemId] = 0;
        }
        requiredByItem[item.itemId] += item.quantity;
    });

    return inventory.filter(b => {
        const totalRequired = requiredByItem[b.id] || 0;
        const safetyStock = b.threshold;
        const totalDemand = totalRequired + safetyStock;
        return b.stock < totalDemand;
    }).length;
  }, [inventory, machineAssignments]);

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
    disabled = false,
  }: {
    targetView: View;
    icon: React.ReactNode;
    label: string;
    badgeCount?: number;
    isSubItem?: boolean;
    onClick: (view: View) => void;
    disabled?: boolean;
  }) => (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        if (!disabled) onClick(targetView);
      }}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all ${
        disabled 
          ? 'cursor-not-allowed opacity-50'
          : 'hover:text-primary'
      } ${
        view === targetView ? "bg-muted text-primary" : ""
      } ${isSubItem ? 'pl-11' : ''}`}
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
    if (view === 'organization') return 'Organización de Planta';
    if (view === 'users') return 'Gestionar Usuarios';
    if (view.startsWith('machine-')) {
        const machineId = view.replace('machine-', '');
        for (const sector of sortedSectors) {
            const machine = machinesBySector[sector.id]?.find(m => m.id === machineId);
            if (machine) {
                return `${sector.name} / ${machine.name}`;
            }
        }
    }
    return 'Panel de control';
  }

  const renderContent = () => {
    const isLoading = isInventoryLoading || isAssignmentsLoading || isUsageLogLoading || isSectorsLoading || areMachinesLoading || isSeeding || isProfileLoading;
     if (isLoading) {
        return <Skeleton className="h-full w-full" />
    }

    if (view === 'dashboard') {
      return <Dashboard
        inventory={sortedInventory}
        onUpdateItem={handleUpdateItem}
        onAddItem={handleAddItem}
        canEdit={isAdmin}
      />
    }
    if (view === 'reports') {
      return <Reports usageLog={sortedUsageLog} sectors={sortedSectors} machinesBySector={machinesBySector} />
    }
    if (view === 'to-buy') {
        return <ToBuyView inventory={sortedInventory} machineAssignments={sortedAssignments}/>
    }
    if (view === 'organization' && isAdmin) {
        return <OrganizationView sectors={sortedSectors} machinesBySector={machinesBySector} firestore={firestore}/>
    }
    if(view === 'users' && isAdmin) {
        return <UserManagementView firestore={firestore} currentUser={userProfile} />
    }
    if (view.startsWith('machine-')) {
        const machineId = view.replace('machine-', '');
        const sector = sortedSectors.find(s => machinesBySector[s.id]?.some(m => m.id === machineId));
        if (!sector) return null;
        const machine = machinesBySector[sector.id].find(m => m.id === machineId);
        if(!machine) return null;

        return <MachineView 
            sector={sector} 
            machine={machine}
            allInventory={sortedInventory} 
            machineAssignments={sortedAssignments.filter(item => item.machineId === machineId)}
            onAssignItem={handleAssignItemToMachine}
            onRemoveItem={handleRemoveItemFromMachine}
            onLogUsage={handleLogUsage}
            canEdit={isAdmin}
        />
    }
    return null;
  }

  const handleNavClick = (targetView: View) => {
    setView(targetView);
    setIsSheetOpen(false);
  };
  
  const toggleSector = (sectorId: string) => {
    setOpenSectors(prev => 
      prev.includes(sectorId) ? prev.filter(id => id !== sectorId) : [...prev, sectorId]
    );
  };

  const MainNav = ({ isMobile = false }) => (
     <nav className={`grid items-start ${isMobile ? 'gap-2 text-lg' : 'px-2 text-sm'} font-medium ${isMobile ? '' : 'lg:px-4'}`}>
      <NavLink
        targetView="dashboard"
        icon={<Home className={isMobile ? "h-5 w-5" : "h-4 w-4"} />}
        label="Panel de control"
        onClick={handleNavClick}
      />
      <NavLink
        targetView="organization"
        icon={<Settings className={isMobile ? "h-5 w-5" : "h-4 w-4"} />}
        label="Organización"
        onClick={handleNavClick}
        disabled={!isAdmin}
      />
      
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Máquinas por Sector</div>

        {sortedSectors.map(sector => (
            <Collapsible key={sector.id} open={openSectors.includes(sector.id)} onOpenChange={() => toggleSector(sector.id)}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary [&[data-state=open]>div>svg.chevron]:rotate-90">
                    <div className="flex items-center gap-3">
                        <Package className={isMobile ? "h-5 w-5" : "h-4 w-4"}/>
                        <span className="font-semibold">{sector.name}</span>
                    </div>
                    <ChevronRight className="chevron h-4 w-4 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-1">
                    {(machinesBySector[sector.id] || []).sort((a,b) => a.name.localeCompare(b.name)).map(machine => (
                        <NavLink
                            key={machine.id}
                            targetView={`machine-${machine.id}`}
                            icon={<HardDrive className="h-4 w-4"/>} 
                            label={machine.name}
                            isSubItem={true}
                            onClick={handleNavClick}
                        />
                    ))}
                </CollapsibleContent>
            </Collapsible>
        ))}
      

      <div className="mt-auto border-t pt-4">
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
        <NavLink
            targetView="users"
            icon={<Users className={isMobile ? "h-5 w-5" : "h-4 w-4"} />}
            label="Gestionar Usuarios"
            onClick={handleNavClick}
            disabled={!isAdmin}
        />
      </div>
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
              <DropdownMenuLabel>
                {user?.email}
                {userProfile?.role && <Badge variant="secondary" className="ml-2">{userProfile.role}</Badge>}
                </DropdownMenuLabel>
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

    