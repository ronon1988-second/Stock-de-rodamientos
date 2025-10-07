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
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function UserManagementView({ isAdmin }: { isAdmin: boolean }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

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
      // 1. Find the user's UID from their email in the /users collection
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where("email", "==", email), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: 'Usuario no encontrado',
          description: `No se encontró ningún usuario con el correo electrónico ${email}.`,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;

      // 2. Call the server action with the UID and role
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
  
  // This component is now only visible to the master user, so this check is redundant but safe.
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
      </CardContent>
    </Card>
  );
}
