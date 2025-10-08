
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
import type { UserProfile, UserRole } from '@/lib/types';
import { Loader2, ShieldQuestion } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type UserManagementViewProps = {
    users: UserProfile[];
    allRoles: UserRole[];
}

type UserWithRole = UserProfile & { role: UserRole['role'] | null };

export default function UserManagementView({ users, allRoles }: UserManagementViewProps) {
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
    const [role, setRole] = useState<UserRole['role'] | 'user'>('user');
    const [isLoading, setIsLoading] = useState(false);

    const usersWithRoles: UserWithRole[] = React.useMemo(() => {
        const rolesMap = new Map(allRoles.map(r => [r.id, r.role]));
        return users.map(user => ({
            ...user,
            role: rolesMap.get(user.uid) || null,
        }));
    }, [users, allRoles]);

    const handleSelectUser = (user: UserWithRole) => {
        setSelectedUser(user);
        setRole(user.role || 'user');
    };

    const handleUpdateRole = async () => {
        if (!selectedUser || !role || role === 'user') {
            toast({
                title: 'No se puede asignar el rol',
                description: 'Por favor, seleccione un usuario y un rol válido (Editor o Administrador).',
                variant: 'destructive',
            });
            return;
        }

        const validRole = role as 'admin' | 'editor';
        
        setIsLoading(true);

        const result = await updateUserRole(selectedUser.uid, validRole);

        if (result.success) {
            toast({
                title: 'Rol Actualizado',
                description: `El usuario ${selectedUser.email} ahora tiene el rol de ${role}.`,
            });
            setSelectedUser(null);
            // The parent component will receive the updated roles via the useCollection hook
        } else {
            toast({
                title: 'Error al Actualizar Rol',
                description: result.error || 'Ocurrió un error inesperado.',
                variant: 'destructive',
            });
        }
        setIsLoading(false);
    };

    const getRoleDisplayName = (role: UserRole['role'] | null) => {
        if (role === 'admin') return 'Administrador';
        if (role === 'editor') return 'Editor';
        return 'Usuario';
    }

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
                                <TableHead>Rol Actual</TableHead>
                                <TableHead>Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usersWithRoles.map(user => (
                                <TableRow 
                                    key={user.uid} 
                                    className={selectedUser?.uid === user.uid ? 'bg-muted' : ''}
                                >
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.displayName}</TableCell>
                                    <TableCell>
                                        {user.role ? getRoleDisplayName(user.role) : (
                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                <ShieldQuestion size={16} />
                                                Usuario
                                            </span>
                                        )}
                                    </TableCell>
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
                         <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Usuario</label>
                            <Input
                                placeholder="Email del usuario"
                                value={selectedUser?.email || ''}
                                readOnly
                                disabled
                                className="flex-grow"
                            />
                        </div>

                         <div className="space-y-1">
                            <label className="text-sm font-medium">Nuevo Rol</label>
                             <Select 
                                onValueChange={(value: 'admin' | 'editor' | 'user') => setRole(value)} 
                                value={role} 
                                disabled={isLoading || !selectedUser}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">Usuario</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                        <Button 
                            onClick={handleUpdateRole} 
                            disabled={isLoading || !selectedUser || role === 'user'} 
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
