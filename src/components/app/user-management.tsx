
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

export default function UserManagementView({ isAdmin }: { isAdmin: boolean }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
    const result = await updateUserRole(email, role);
    setIsLoading(false);

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
          Asigne un rol a un usuario específico utilizando su dirección de correo electrónico.
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
