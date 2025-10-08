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
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


type UserManagementViewProps = {
    users: UserProfile[] | null;
}

type UserWithRoleFetcherProps = {
    user: UserProfile;
    onSelect: (user: UserProfile & { role: UserRole['role'] | null }) => void;
    isSelected: boolean;
};

// This new component will fetch the role for a single user
const UserRow = ({ user, onSelect, isSelected }: UserWithRoleFetcherProps) => {
    const firestore = useFirestore();
    const roleRef = useMemoFirebase(() => firestore ? doc(firestore, 'roles', user.id) : null, [firestore, user.id]);
    const { data: roleDoc, isLoading } = useDoc<UserRole>(roleRef);

    const role = roleDoc?.role || null;
    const getRoleDisplayName = (role: UserRole['role'] | null) => {
        if (role === 'admin') return 'Administrador';
        if (role === 'editor') return 'Editor';
        return 'Usuario';
    }

    return (
        <TableRow 
            key={user.uid} 
            className={isSelected ? 'bg-muted' : ''}
        >
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.displayName}</TableCell>
            <TableCell>
                <span className="flex items-center gap-2">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 
                     (role === null && <ShieldQuestion size={16} className="text-muted-foreground" />)}
                    {isLoading ? 'Cargando...' : getRoleDisplayName(role)}
                </span>
            </TableCell>
            <TableCell>
                <Button variant="outline" size="sm" onClick={() => onSelect({ ...user, role })}>
                    Gestionar
                </Button>
            </TableCell>
        </TableRow>
    );
};


export default function UserManagementView({ users }: UserManagementViewProps) {
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = useState<(UserProfile & { role: UserRole['role'] | null }) | null>(null);
    const [role, setRole] = useState<UserRole['role'] | 'user'>('user');
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectUser = (userWithRole: UserProfile & { role: UserRole['role'] | null }) => {
        setSelectedUser(userWithRole);
        setRole(userWithRole.role || 'user');
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) { 
            toast({
                title: 'Selección inválida',
                description: 'Por favor, seleccione un usuario.',
                variant: 'destructive',
            });
            return;
        }

        const roleToSet = role === 'user' ? null : role;
        
        if (roleToSet === selectedUser.role) {
             toast({
                title: 'Sin cambios',
                description: `El usuario ya tiene el rol de ${getRoleDisplayName(roleToSet)}.`,
            });
            return;
        }

        setIsLoading(true);
        
        if (roleToSet === null) {
            // This is a limitation for now, as we need a separate server action to securely nullify claims.
            toast({
                title: 'Función no implementada',
                description: 'La degradación a rol de "Usuario" aún no está soportada. Por favor asigne "Editor" o "Admin".',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }
        

        const result = await updateUserRole(selectedUser.uid, roleToSet as 'admin' | 'editor');

        if (result.success) {
            toast({
                title: 'Rol Actualizado',
                description: `El usuario ${selectedUser.email} ahora tiene el rol de ${getRoleDisplayName(roleToSet)}. Refresque la página para ver el cambio en la lista.`,
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
                    {!users ? (
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
                                {users.map(user => (
                                    <UserRow 
                                        key={user.id}
                                        user={user}
                                        onSelect={handleSelectUser}
                                        isSelected={selectedUser?.id === user.id}
                                    />
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
