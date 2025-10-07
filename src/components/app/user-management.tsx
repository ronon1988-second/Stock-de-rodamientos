"use client";

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { updateUserRole } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

export default function UserManagementView({ isAdmin }: { isAdmin: boolean }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const usersRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersRef);

  const handleUpdateRole = async () => {
    if (!email || !role) {
      toast({
        title: 'Campos Incompletos',
        description: 'Por favor, ingrese un email y seleccione un rol.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      if (!users) {
        throw new Error("La lista de usuarios no está disponible.");
      }
      
      const user = users.find(u => u.email === email);

      if (!user) {
        toast({
          title: 'Usuario no encontrado',
          description: `No se encontró ningún usuario con el correo electrónico ${email}.`,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const userId = user.id; // The document ID is the user's UID in the /users collection

      const result = await updateUserRole(userId, role);

      if (result.success) {
        toast({
          title: 'Rol Actualizado',
          description: `El usuario ${email} ahora tiene el rol de ${role}.`,
        });
        setEmail('');
        setRole('');
      } else {
        toast({
          title: 'Error al Actualizar Rol',
          description: result.error || 'Ocurrió un error inesperado.',
          variant: 'destructive',
        });
      }
    } catch (error) {
       toast({
        title: 'Error de Búsqueda',
        description: 'No se pudo buscar al usuario en la base de datos.',
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  if (!isAdmin) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Acceso Denegado</CardTitle>
                <CardDescription>
                Necesita permisos de administrador para gestionar los roles de usuario.
                </CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Roles de Usuario</CardTitle>
        <CardDescription>
          Asigne un rol a un usuario específico utilizando su dirección de correo electrónico. El cambio se reflejará en tiempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingUsers ? <Skeleton className="h-20 w-full" /> : (
          <>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Input
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow"
                disabled={isLoading}
                />
                <Select 
                    value={role} 
                    onValueChange={(value) => setRole(value as 'admin' | 'editor')}
                    disabled={isLoading}
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Seleccionar Rol" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleUpdateRole} disabled={isLoading || !email || !role}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Asignando Rol...' : 'Asignar Rol'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
