
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
import { Loader2, ShieldQuestion, UserX } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


type UserManagementViewProps = {
    users: UserProfile[] | null; // Can be null if query fails
    allRoles: UserRole[] | null; // Can be null
}

type UserWithRole = UserProfile & { role: UserRole['role'] | null };

export default function UserManagementView({ users, allRoles }: UserManagementViewProps) {
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
    const [role, setRole] = useState<UserRole['role'] | 'user'>('user');
    const [isLoading, setIsLoading] = useState(false);

    const usersWithRoles: UserWithRole[] | null = React.useMemo(() => {
        if (!users || !allRoles) return null; 
        const rolesMap = new Map(allRoles.map(r => [r.id, r.role]));
        return users.map(user => ({
            ...user,
            role: rolesMap.get(user.id) || null,
        }));
    }, [users, allRoles]);

    const handleSelectUser = (user: UserWithRole) => {
        setSelectedUser(user);
        setRole(user.role || 'user');
    };

    const handleUpdateRole = async () => {
        if (!selectedUser || !role) { 
            toast({
                title: 'Selección inválida',
                description: 'Por favor, seleccione un usuario y un rol.',
                variant: 'destructive',
            });
            return;
        }

        const roleToSet = role === 'user' ? null : role;
        const currentRole = usersWithRoles?.find(u => u.uid === selectedUser.uid)?.role || null;
        
        if (roleToSet === currentRole) {
             toast({
                title: 'Sin cambios',
                description: `El usuario ya tiene el rol de ${getRoleDisplayName(roleToSet)}.`,
            });
            return;
        }

        setIsLoading(true);
        
        if (roleToSet === null) {
            toast({
                title: 'Función no implementada',
                description: 'La degradación a rol de "Usuario" se debe implementar en una acción de servidor separada.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }
        

        const result = await updateUserRole(selectedUser.uid, roleToSet as 'admin' | 'editor');

        if (result.success) {
            toast({
                title: 'Rol Actualizado',
                description: `El usuario ${selectedUser.email} ahora tiene el rol de ${getRoleDisplayName(roleToSet)}.`,
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
                    {!usersWithRoles ? (
                         <Alert variant="destructive">
                            <UserX className="h-4 w-4" />
                            <AlertTitle>No se pudieron cargar los usuarios</AlertTitle>
                            <AlertDescription>
                                No se pudieron cargar los perfiles de usuario. Esto puede deberse a las reglas de seguridad de Firestore. Verifique que los administradores tengan permiso para listar la colección 'users'.
                            </AlertDescription>
                        </Alert>
                    ) : (
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
                                            <span className="flex items-center gap-2">
                                                {user.role === null && <ShieldQuestion size={16} className="text-muted-foreground" />}
                                                {getRoleDisplayName(user.role)}
                                            </span>
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
                    )}
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

