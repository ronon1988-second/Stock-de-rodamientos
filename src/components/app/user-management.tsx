
"use client";

import React, { useState, useEffect } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type UserManagementViewProps = {
    users: UserProfile[];
}

export default function UserManagementView({ users }: UserManagementViewProps) {
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [role, setRole] = useState<'admin' | 'editor'>('editor');
    const [isLoading, setIsLoading] = useState(false);


    const handleSelectUser = (user: UserProfile) => {
        setSelectedUser(user);
        // We need to fetch the role for this user to pre-fill the select
        // For now, let's just default to 'editor'. A more complete solution would fetch this.
        setRole('editor');
    }

    const handleUpdateRole = async () => {
        if (!selectedUser) {
            toast({
                title: 'Usuario no seleccionado',
                description: 'Por favor, seleccione un usuario de la lista.',
                variant: 'destructive',
            });
            return;
        }
        
        setIsLoading(true);

        const result = await updateUserRole(selectedUser.uid, role);

        if (result.success) {
            toast({
                title: 'Rol Actualizado',
                description: `El usuario ${selectedUser.email} ahora tiene el rol de ${role}.`,
            });
            setSelectedUser(null);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Lista de Usuarios</CardTitle>
                    <CardDescription>
                        Seleccione un usuario para ver y modificar su rol.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow 
                                    key={user.uid} 
                                    className={selectedUser?.uid === user.uid ? 'bg-muted' : ''}
                                >
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.displayName}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => handleSelectUser(user)}>
                                            Gestionar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Asignar Rol</CardTitle>
                    <CardDescription>
                       {selectedUser ? `Asignando rol a ${selectedUser.email}` : "Seleccione un usuario de la lista."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Input
                            placeholder="Email del usuario"
                            value={selectedUser?.email || ''}
                            readOnly
                            disabled
                            className="flex-grow"
                        />
                        <Select 
                            onValueChange={(value: 'admin' | 'editor') => setRole(value)} 
                            value={role} 
                            disabled={isLoading || !selectedUser}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button 
                            onClick={handleUpdateRole} 
                            disabled={isLoading || !selectedUser} 
                            className="w-full"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isLoading ? 'Asignando...' : 'Asignar Rol'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
