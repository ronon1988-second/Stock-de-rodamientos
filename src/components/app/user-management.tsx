
"use client";

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateUserRole } from '@/app/actions';
import type { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type UserManagementViewProps = {
    users: UserProfile[];
}

export default function UserManagementView({ users }: UserManagementViewProps) {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'editor'>('editor');
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateRole = async () => {
        if (!email || !role) {
            toast({
                title: 'Campos Incompletos',
                description: 'Por favor ingrese un email y seleccione un rol.',
                variant: 'destructive',
            });
            return;
        }
        
        setIsLoading(true);

        const targetUser = users.find(user => user.email === email.trim());

        if (!targetUser) {
            toast({
                title: 'Error de Búsqueda',
                description: 'No se pudo encontrar un usuario con ese email en la base de datos.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }

        const result = await updateUserRole(targetUser.uid, role);

        if (result.success) {
            toast({
                title: 'Rol Actualizado',
                description: `El usuario ${email} ahora tiene el rol de ${role}.`,
            });
            setEmail('');
        } else {
            toast({
                title: 'Error al Actualizar Rol',
                description: result.error || 'Ocurrió un error inesperado.',
                variant: 'destructive',
            });
        }
        setIsLoading(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestionar Roles de Usuario</CardTitle>
                <CardDescription>
                    Asigne un rol a un usuario específico utilizando su dirección de correo electrónico.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        placeholder="Email del usuario"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-grow"
                        disabled={isLoading}
                    />
                    <Select onValueChange={(value: 'admin' | 'editor') => setRole(value)} defaultValue={role} disabled={isLoading}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleUpdateRole} disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isLoading ? 'Asignando...' : 'Asignar Rol'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

    