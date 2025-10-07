
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
} from 'lucide-react';
import {
  collection,
  doc,
  writeBatch,
  query,
  onSnapshot,
  getDoc,
  serverTimestamp,
  getDocs,
  addDoc,
  setDoc,
  where
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
  UserRole,
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
  useDoc,
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
import {
  setDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import OrganizationView from '@/components/app/organization-view';
import UserManagementView from '@/components/app/user-management';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  const machinesRef = useMemoFirebase(
    () => (firestore && sector.id ? collection(firestore, `sectors/${sector.id}/machines`) : null),
    [firestore, sector.id]
  );
  const { data: machines, isLoading } = useCollection<Machine>(machinesRef);

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

function AppContent() {
  const [view, setView] = useState<View>('dashboard');
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSeeding, setIsSeeding] = useState(false);
  
  // Master user has all privileges, bypassing role checks.
  const isMasterUser = user?.email === 'maurofbordon@gmail.com';

  const roleRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'roles', user.uid) : null),
    [firestore, user]
  );
  const { data: userRoleDoc, isLoading: isRoleLoading } = useDoc<UserRole>(roleRef);

  const isAdmin = isMasterUser || userRoleDoc?.role === 'admin';
  const isEditor = isAdmin || userRoleDoc?.role === 'editor';

  // This effect handles the creation of user profile on first login
  useEffect(() => {
    const setupUser = async () => {
      if (!user || !firestore) return;

      const userRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const userData: Omit<UserProfile, 'id'> = {
            uid: user.uid,
            email: user.email!,
            displayName: user.email?.split('@')[0] || 'Usuario',
        };
        await setDoc(userRef, userData);
        toast({
          title: "Perfil de usuario creado",
          description: "¡Bienvenido! Su perfil ha sido guardado."
        });
      }
    };
    setupUser();
  }, [user, firestore, toast]);

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } =
    useDoc<UserProfile>(userProfileRef);

  // START: DATA FETCHING
  const inventoryRef = useMemoFirebase(() => firestore ? collection(firestore, 'inventory') : null, [firestore]);
  const { data: inventory, isLoading: isInventoryLoading } = useCollection<InventoryItem>(inventoryRef);

  const sectorsRef = useMemoFirebase(() => firestore ? collection(firestore, 'sectors') : null, [firestore]);
  const { data: sectors, isLoading: isSectorsLoading } = useCollection<Sector>(sectorsRef);
  
  const assignmentsRef = useMemoFirebase(() => firestore ? collection(firestore, 'machineAssignments') : null, [firestore]);
  const { data: machineAssignments, isLoading: isAssignmentsLoading } = useCollection<MachineAssignment>(assignmentsRef);
  
  const usageLogRef = useMemoFirebase(() => firestore ? collection(firestore, 'usageLog') : null, [firestore]);
  const { data: usageLog, isLoading: isUsageLogLoading } = useCollection<UsageLog>(usageLogRef);
  // END: DATA FETCHING
    
  const [machinesBySector, setMachinesBySector] = useState<
    Record<string, Machine[]>
  >({});

  useEffect(() => {
    const seedData = async () => {
        if (!firestore || !user || isInventoryLoading || isSectorsLoading || isSeeding) return;

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

                // Seed inventory
                initialInventory.forEach(item => {
                    const docRef = doc(collection(firestore, 'inventory'));
                    batch.set(docRef, item);
                });

                // Seed sectors and get their new IDs
                const sectorPromises = initialSectors.map(async (sectorData) => {
                    const sectorRef = doc(collection(firestore, 'sectors'));
                    batch.set(sectorRef, sectorData);
                    return { name: sectorData.name, id: sectorRef.id };
                });
                const createdSectors = await Promise.all(sectorPromises);
                const sectorIdMap = createdSectors.reduce((acc, sec) => {
                    acc[sec.name] = sec.id;
                    return acc;
                }, {} as Record<string, string>);

                // Seed machines with the correct sectorId
                initialMachines.forEach(machineData => {
                    const sectorId = sectorIdMap[machineData.sectorName];
                    if (sectorId) {
                        const machineRef = doc(collection(firestore, `sectors/${sectorId}/machines`));
                        const { sectorName, ...data } = machineData;
                        batch.set(machineRef, { ...data, sectorId });
                    }
                });

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
  }, [firestore, user, toast, isSeeding, isInventoryLoading, isSectorsLoading]);


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
    () =>
      usageLog
        ? [...usageLog].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        : [],
    [usageLog]
  );
    
  const allMachines = useMemo(() => {
    return Object.values(machinesBySector).flat();
  }, [machinesBySector]);

  const handleAddItem = async (newItem: Omit<InventoryItem, 'id'>) => {
    if (!isEditor || !firestore) {
        toast({ title: "Acceso denegado", variant: "destructive" });
        return;
    }
    await addDoc(collection(firestore, 'inventory'), newItem);
    toast({
      title: 'Artículo Agregado',
      description: `Se ha agregado ${newItem.name} al inventario.`,
    });
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    if (!isEditor || !firestore) {
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

  const handleAssignItemToMachine = async (
    itemId: string,
    machineId: string,
    sectorId: string,
    quantity: number
  ) => {
    if (!isEditor || !inventory || !firestore) {
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

    await addDoc(collection(firestore, 'machineAssignments'), newAssignment);

    toast({
      title: 'Artículo Asignado',
      description: `Se han asignado ${quantity} unidades de ${item.name}.`,
    });
  };

  const handleRemoveItemFromMachine = async (assignmentId: string) => {
    if (!isEditor || !firestore) {
        toast({ title: "Acceso denegado", variant: "destructive" });
        return;
    }
    const assignment = machineAssignments?.find(item => item.id === assignmentId);
    if (!assignment) return;

    await setDoc(doc(firestore, 'machineAssignments', assignmentId), {}, {merge: true});

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
    if (!isEditor || !inventory || !firestore) {
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
    await setDoc(itemRef, { stock: updatedStock }, { merge: true });

    const newLog: Omit<UsageLog, 'id'> = {
      itemId,
      itemName: item.name,
      quantity,
      date: new Date().toISOString(),
      sectorId,
      machineId,
    };
    await addDoc(collection(firestore, 'usageLog'), newLog);

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
  };

  const lowStockCount = useMemo(() => {
    if (!inventory) return 0;

    return inventory.filter(b => b.stock < b.threshold).length;
  }, [inventory]);

  const handleLogout = async () => {
    await auth.signOut();
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión exitosamente.',
    });
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
      const machineId = view.replace('machine-', '');
      const machine = allMachines.find(m => m.id === machineId);
      const sector = sortedSectors.find(s => s.id === machine?.sectorId);
      if (machine && sector) {
          return `${sector.name} / ${machine.name}`;
      }
    }
    return 'Panel de control';
  };

  const renderContent = () => {
    const isLoading =
      isInventoryLoading ||
      isAssignmentsLoading ||
      isUsageLogLoading ||
      isSectorsLoading ||
      isSeeding ||
      isProfileLoading ||
      isRoleLoading;

    if (isLoading) {
      return <Skeleton className="h-full w-full" />;
    }
    
    if (view === 'dashboard') {
      return (
        <Dashboard
          inventory={sortedInventory}
          onUpdateItem={handleUpdateItem}
          onAddItem={handleAddItem}
          canEdit={isEditor}
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
    if (view === 'organization') {
      if (!isAdmin) {
        setView('dashboard');
        toast({ title: "Acceso denegado", description: "Necesita permisos de administrador.", variant: "destructive"})
        return null;
      }
      return (
        <OrganizationView
          sectors={sortedSectors}
        />
      );
    }
    if (view === 'users') {
        if (!isAdmin) { 
            setView('dashboard');
            toast({ title: "Acceso denegado", description: "Necesita permisos de administrador.", variant: "destructive"})
            return null;
        }
      return <UserManagementView />;
    }
    if (view.startsWith('machine-')) {
      const machineId = view.replace('machine-', '');
      const machine = allMachines.find(m => m.id === machineId);
      if (!machine) return <Skeleton className="h-full w-full" />
      const sector = sortedSectors.find(s => s.id === machine.sectorId);
      if (!sector) return <Skeleton className="h-full w-full" />
      
      return (
        <MachineView
          sector={sector}
          machine={machine}
          allInventory={sortedInventory}
          machineAssignments={sortedAssignments.filter(
            item => item.machineId === machineId
          )}
          onAssignItem={handleAssignItemToMachine}
          onRemoveItem={handleRemoveItemFromMachine}
          onLogUsage={handleLogUsage}
          canEdit={isEditor}
        />
      );
    }
   
    // Fallback view
    return (
        <Dashboard
            inventory={sortedInventory}
            onUpdateItem={handleUpdateItem}
            onAddItem={handleAddItem}
            canEdit={isEditor}
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
      {isAdmin && (
        <>
          <NavLink
              targetView="organization"
              icon={<Settings className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />}
              label="Organización"
              onClick={handleNavClick}
          />
          <NavLink
            targetView="users"
            icon={<Users className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />}
            label="Gestionar Usuarios"
            onClick={handleNavClick}
          />
        </>
      )}

      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
        Máquinas por Sector
      </div>

      <Accordion type="single" collapsible className="w-full">
        {sortedSectors.map(sector => (
          <AccordionItem key={sector.id} value={sector.id} className="border-b-0">
            <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:no-underline">
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

  // This effect listens for when machines are loaded for any sector
  // and aggregates them into the allMachines state
  useEffect(() => {
    if (!firestore || !sectors) return;

    const unsubscribes = sectors.map(sector => {
        const machinesQuery = query(collection(firestore, `sectors/${sector.id}/machines`));
        return onSnapshot(machinesQuery, (snapshot) => {
            const machines = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Machine[];
            setMachinesBySector(prev => ({
                ...prev,
                [sector.id]: machines
            }));
        });
    });

    return () => unsubscribes.forEach(unsub => unsub());
}, [firestore, sectors]);


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
                {isMasterUser && '(Master)'}
                {userRoleDoc?.role && ` - ${userRoleDoc.role}`}
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

    