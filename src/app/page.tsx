
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Home,
  LineChart,
  Menu,
  ShoppingCart,
  Package,
  User,
  LogOut,
  Settings,
  HardDrive,
  Users,
  ShieldAlert,
} from 'lucide-react';
import {
  collection,
  doc,
  writeBatch,
  query,
  getDocs,
} from 'firebase/firestore';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  InventoryItem,
  UsageLog,
  Sector,
  Machine,
  MachineAssignment,
  UserProfile,
  MachinesBySector,
} from '@/lib/types';
import { initialInventory, initialSectors, initialMachines } from '@/lib/data';
import Dashboard from '@/components/app/dashboard';
import Reports from '@/components/app/reports';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/app/logo';
import MachineView from '@/components/app/machine-view';
import ToBuyView from '@/components/app/to-buy-view';
import {
  useUser,
  useAuth,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import OrganizationView from '@/components/app/organization-view';
import UserManagementView from '@/components/app/user-management';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { updateUserRole } from './actions';

type View =
  | 'dashboard'
  | 'reports'
  | 'to-buy'
  | 'organization'
  | 'users'
  | `machine-${string}`;

// Helper component to fetch machines for a sector
function MachineList({
  sector,
  onNavClick,
  isMobile,
}: {
  sector: Sector;
  onNavClick: (view: View) => void;
  isMobile: boolean;
}) {
  const firestore = useFirestore();
  const machinesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, `sectors/${sector.id}/machines`)) : null),
    [firestore, sector.id]
  );
  const { data: machines, isLoading } = useCollection<Machine>(machinesQuery);

  if (isLoading) {
    return (
      <div className="space-y-1 pt-1 pl-11">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  return (
    <div className="space-y-1 pt-1 pl-7">
      {(machines || [])
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(machine => (
          <a
            key={machine.id}
            href="#"
            onClick={e => {
              e.preventDefault();
              onNavClick(`machine-${machine.id}`);
            }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary pl-4 ${isMobile ? 'text-lg' : 'text-sm'}`}
          >
            <HardDrive className="h-4 w-4" />
            {machine.name}
          </a>
        ))}
    </div>
  );
}

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


function AppContent() {
  const isTestingAdmin = false;
  const [view, setView] = useState<View>('dashboard');
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSeeding, setIsSeeding] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  
  useEffect(() => {
    if (isTestingAdmin) {
      setIsAdmin(true);
      setIsEditor(true);
      return;
    }
    const fetchUserClaims = async () => {
      if (user) {
        try {
          // Force a refresh of the token to get the latest claims from the server.
          console.log("Forcing token refresh to get latest claims...");
          const idTokenResult = await user.getIdTokenResult(true); 
          console.log("Token refreshed. Claims:", idTokenResult.claims);
          const claims = idTokenResult.claims;
          setIsAdmin(!!claims.admin);
          setIsEditor(!!claims.editor || !!claims.admin);
        } catch (error) {
          console.error("Error fetching user claims:", error);
          setIsAdmin(false);
          setIsEditor(false);
        }
      } else {
        setIsAdmin(false);
        setIsEditor(false);
      }
    };

    fetchUserClaims();
  }, [user, isTestingAdmin]);
  
  const canLogUsage = !!user;
  const canEdit = isEditor || isAdmin;

  // DATA FETCHING
  const allUsersRef = useMemoFirebase(() => (firestore && isAdmin && !isTestingAdmin ? collection(firestore, 'users') : null), [firestore, isAdmin, isTestingAdmin]);
  const { data: allUsers, isLoading: isAllUsersLoading } = useCollection<UserProfile>(allUsersRef);

  const inventoryRef = useMemoFirebase(() => firestore ? collection(firestore, 'inventory') : null, [firestore]);
  const { data: inventory, isLoading: isInventoryLoading } = useCollection<InventoryItem>(inventoryRef);

  const sectorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'sectors') : null, [firestore]);
  const { data: sectors, isLoading: isSectorsLoading } = useCollection<Sector>(sectorsRef);
  
  const assignmentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'machineAssignments') : null, [firestore]);
  const { data: machineAssignments, isLoading: isAssignmentsLoading } = useCollection<MachineAssignment>(assignmentsRef);
  
  const usageLogRef = useMemoFirebase(() => (firestore && !isTestingAdmin ? collection(firestore, 'usageLog') : null), [firestore, isTestingAdmin]);
  const { data: usageLog, isLoading: isUsageLogLoading } = useCollection<UsageLog>(usageLogRef);

  const { machinesBySector, isLoading: isLoadingMachines } = useAllMachines(sectors || []);


  useEffect(() => {
    const seedData = async () => {
        if (!firestore || !user || isInventoryLoading || isSectorsLoading || isSeeding || !isAdmin) return;

        const invQuery = query(collection(firestore, 'inventory'));
        const sectorsQuery = query(collection(firestore, 'sectors'));
        
        const [invSnapshot, sectorsSnapshot] = await Promise.all([
          getDocs(invQuery),
          getDocs(sectorsQuery)
        ]);
        
        if (invSnapshot.empty && sectorsSnapshot.empty) {
            setIsSeeding(true);
            toast({
                title: 'Cargando datos iniciales...',
                description: 'Por favor espere. Esto puede tardar un momento.',
            });
            try {
                const batch = writeBatch(firestore);

                initialInventory.forEach(item => {
                    const docRef = doc(collection(firestore, 'inventory'));
                    batch.set(docRef, item);
                });

                 for (const sectorData of initialSectors) {
                    const sectorRef = doc(collection(firestore, 'sectors'));
                    batch.set(sectorRef, sectorData);
                    
                    const machinesForSector = initialMachines.filter(m => m.sectorName === sectorData.name);
                    machinesForSector.forEach(machineData => {
                        const machineRef = doc(collection(firestore, `sectors/${sectorRef.id}/machines`));
                        const { sectorName, ...data } = machineData;
                        batch.set(machineRef, { ...data, sectorId: sectorRef.id });
                    });
                }
               
                await batch.commit();
                toast({
                    title: 'Datos iniciales listos',
                    description: 'El inventario, sectores y máquinas han sido inicializados.',
                });
            } catch (error) {
                console.error('Error seeding data: ', error);
                toast({
                    variant: 'destructive',
                    title: 'Error al sembrar datos',
                    description: 'No se pudo inicializar la estructura de datos.',
                });
            } finally {
                setIsSeeding(false);
            }
        }
    };

    seedData();
  }, [firestore, user, toast, isSeeding, isInventoryLoading, isSectorsLoading, isAdmin]);


  const sortedInventory = useMemo(
    () =>
      inventory
        ? [...inventory].sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [inventory]
  );
  const sortedSectors = useMemo(
    () =>
      sectors ? [...sectors].sort((a, b) => a.name.localeCompare(b.name)) : [],
    [sectors]
  );
  const sortedAssignments = useMemo(
    () => (machineAssignments ? [...machineAssignments] : []),
    [machineAssignments]
  );
  
  const sortedUsageLog = useMemo(
    () => {
        if(isTestingAdmin) return [];
        return usageLog
            ? [...usageLog].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              )
            : []
    },
    [usageLog, isTestingAdmin]
  );

  const handleAddItem = (newItem: Omit<InventoryItem, 'id'>) => {
    if (!canEdit || !firestore) {
        toast({ title: "Acceso denegado", variant: "destructive" });
        return;
    }
    addDocumentNonBlocking(collection(firestore, 'inventory'), newItem);
    toast({
      title: 'Artículo Agregado',
      description: `Se ha agregado ${newItem.name} al inventario.`,
    });
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    if (!canEdit || !firestore) {
        toast({ title: "Acceso denegado", variant: "destructive" });
        return;
    }
    const itemRef = doc(firestore, 'inventory', updatedItem.id);
    const { id, ...data } = updatedItem;
    setDocumentNonBlocking(itemRef, data, { merge: true });
    toast({
      title: 'Artículo Actualizado',
      description: `Se ha actualizado el stock de ${updatedItem.name}.`,
    });
  };

  const handleAssignItemToMachine = (
    itemId: string,
    machineId: string,
    sectorId: string,
    quantity: number
  ) => {
    if (!canEdit || !inventory || !firestore) {
        toast({ title: "Acceso denegado", variant: "destructive" });
        return;
    }
    const item = inventory.find(b => b.id === itemId);
    if (!item) return;

    const newAssignment: Omit<MachineAssignment, 'id'> = {
      sectorId,
      machineId,
      itemId,
      itemName: item.name,
      quantity: quantity,
    };

    addDocumentNonBlocking(collection(firestore, 'machineAssignments'), newAssignment);

    toast({
      title: 'Artículo Asignado',
      description: `Se han asignado ${quantity} unidades de ${item.name}.`,
    });
  };


  const handleRemoveItemFromMachine = (assignmentId: string) => {
    if (!canEdit || !firestore) {
        toast({ title: "Acceso denegado", variant: "destructive" });
        return;
    }
    const assignment = machineAssignments?.find(item => item.id === assignmentId);
    if (!assignment) return;

    deleteDocumentNonBlocking(doc(firestore, 'machineAssignments', assignmentId));

    toast({
      title: 'Asignación Eliminada',
      description: `Se ha quitado el artículo ${assignment.itemName}.`,
    });
  };

  const handleLogUsage = async (
    itemId: string,
    quantity: number,
    machineId: string,
    sectorId: string
  ) => {
    if (!canLogUsage || !inventory || !firestore) {
      toast({ title: "Acceso denegado", variant: "destructive" });
      return;
    }
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    if (item.stock < quantity) {
      toast({
        variant: 'destructive',
        title: 'Error de Stock',
        description: `No hay suficiente stock para ${item.name}.`,
      });
      return;
    }

    const updatedStock = item.stock - quantity;
    const itemRef = doc(firestore, 'inventory', itemId);
    
    const newLog: Omit<UsageLog, 'id'> = {
      itemId,
      itemName: item.name,
      quantity,
      date: new Date().toISOString(),
      sectorId,
      machineId,
    };

    try {
        const batch = writeBatch(firestore);
        batch.update(itemRef, { stock: updatedStock });
        batch.set(doc(collection(firestore, 'usageLog')), newLog);

        await batch.commit();

        toast({
            title: 'Uso Registrado',
            description: `Se han usado ${quantity} unidades de ${item.name}.`,
        });

        if (updatedStock <= item.threshold && item.stock > item.threshold) {
            toast({
                variant: 'destructive',
                title: 'Alerta de Stock Bajo',
                description: `El artículo ${item.name} ha entrado en nivel de stock bajo.`,
            });
        }
    } catch (error) {
        console.error("Error logging usage: ", error);
        toast({
            variant: "destructive",
            title: "Error al registrar uso",
            description: "No se pudo actualizar el stock o el historial."
        })
    }
  };

  const lowStockCount = useMemo(() => {
    if (!inventory) return 0;

    return inventory.filter(b => b.stock < b.threshold).length;
  }, [inventory]);

  const handleLogout = async () => {
    if (auth) {
        await auth.signOut();
        toast({
          title: 'Sesión cerrada',
          description: 'Has cerrado sesión exitosamente.',
        });
    }
  };
  
  const NavLink = ({
    targetView,
    icon,
    label,
    badgeCount,
    onClick,
    disabled = false,
  }: {
    targetView: View;
    icon: React.ReactNode;
    label: string;
    badgeCount?: number;
    onClick: (view: View) => void;
    disabled?: boolean;
  }) => (
    <a
      href="#"
      onClick={e => {
        e.preventDefault();
        if (!disabled) onClick(targetView);
      }}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all ${
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:text-primary'
      } ${view === targetView ? 'bg-muted text-primary' : ''}`}
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
       return 'Máquina';
    }
    return 'Panel de control';
  };

  const renderContent = () => {
    const isDataLoading =
      isUserLoading ||
      isInventoryLoading ||
      isAssignmentsLoading ||
      isUsageLogLoading ||
      isSectorsLoading ||
      isLoadingMachines ||
      isSeeding ||
      (isAdmin && isAllUsersLoading);

    if (isDataLoading) {
      return <Skeleton className="h-full w-full" />;
    }
    
    // Fallback screen if user is not an admin, but the UI thinks they should be.
    // This provides a clear message and avoids a broken UI state.
    if (!isAdmin && (view === 'users' || view === 'organization')) {
      setView('dashboard'); // Force back to a safe view
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Acceso de Administrador Requerido</CardTitle>
                  <CardDescription>No tienes los permisos necesarios para acceder a esta sección. Si crees que esto es un error, por favor, contacta al administrador.</CardDescription>
              </CardHeader>
          </Card>
      );
    }
    
    if (view === 'dashboard') {
      return (
        <Dashboard
          inventory={sortedInventory}
          onUpdateItem={handleUpdateItem}
          onAddItem={handleAddItem}
          canEdit={canEdit}
        />
      );
    }
    if (view === 'reports') {
      return (
        <Reports
          usageLog={sortedUsageLog}
          sectors={sortedSectors}
          machinesBySector={machinesBySector}
        />
      );
    }
    if (view === 'to-buy') {
      return (
        <ToBuyView
          inventory={sortedInventory}
          machineAssignments={sortedAssignments}
        />
      );
    }
    if (view === 'organization' && canEdit) {
      return (
        <OrganizationView
          sectors={sortedSectors}
        />
      );
    }
    if (view === 'users' && isAdmin) {
        const usersToManage = allUsers?.filter(u => user && u.uid !== user.uid) || [];
        return <UserManagementView isTesting={isTestingAdmin} users={usersToManage} />;
    }
    if (view.startsWith('machine-')) {
      const machineId = view.replace('machine-', '');
      return (
        <MachineView
          machineId={machineId}
          allInventory={sortedInventory}
          machineAssignments={sortedAssignments.filter(
            item => item.machineId === machineId
          )}
          onAssignItem={handleAssignItemToMachine}
          onRemoveItem={handleRemoveItemFromMachine}
          onLogUsage={handleLogUsage}
          canEdit={canEdit}
          canLogUsage={canLogUsage}
        />
      );
    }
   
    return (
        <Dashboard
            inventory={sortedInventory}
            onUpdateItem={handleUpdateItem}
            onAddItem={handleAddItem}
            canEdit={canEdit}
        />
    );
  };

  const handleNavClick = (targetView: View) => {
    setView(targetView);
    setIsSheetOpen(false);
  };

  const MainNav = ({ isMobile = false }) => (
    <nav
      className={`grid items-start ${
        isMobile ? 'gap-2 text-lg' : 'px-2 text-sm'
      } font-medium ${isMobile ? '' : 'lg:px-4'}`}
    >
      <NavLink
        targetView="dashboard"
        icon={<Home className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />}
        label="Panel de control"
        onClick={handleNavClick}
      />
      {canEdit && (
        <NavLink
            targetView="organization"
            icon={<Settings className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />}
            label="Organización"
            onClick={handleNavClick}
        />
      )}
       {isAdmin && (
        <NavLink
            targetView="users"
            icon={<Users className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />}
            label="Gestionar Usuarios"
            onClick={handleNavClick}
        />
      )}

      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
        Máquinas por Sector
      </div>

      <Accordion type="single" collapsible className="w-full">
        {(sortedSectors || []).map(sector => (
          <AccordionItem key={sector.id} value={sector.id} className="border-b-0">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-3">
                <Package className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
                <span className="font-semibold">{sector.name}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <MachineList sector={sector} onNavClick={handleNavClick} isMobile={isMobile}/>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-auto border-t pt-4">
        <NavLink
          targetView="to-buy"
          icon={<ShoppingCart className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />}
          label="Artículos a Comprar"
          badgeCount={lowStockCount}
          onClick={handleNavClick}
        />
        <NavLink
          targetView="reports"
          icon={<LineChart className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />}
          label="Reportes"
          onClick={handleNavClick}
        />
      </div>
    </nav>
  );

  if (isUserLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Skeleton className="h-[95vh] w-[95vw] rounded-lg" />
        </div>
      );
  }

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
                  Contacta a soporte si tienes problemas o quieres nuevas
                  funcionalidades.
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
            <SheetContent side="left" className="flex flex-col overflow-auto">
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
            <h1 className="font-semibold text-xl capitalize">
              {getViewTitle()}
            </h1>
          </div>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <User className="h-5 w-4" />
                  <span className="sr-only">Perfil de usuario</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.email}{' '}
                  {isAdmin && '(Admin)'}
                  {isEditor && !isAdmin && '(Editor)'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-[95vh] w-[95vw] rounded-lg" />
      </div>
    );
  }
  
  if (!user) return null;

  return <AppContent />;
}
