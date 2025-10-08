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
import { Loader2, ShieldQuestion, UserX, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type UserManagementViewProps = {
    users: UserProfile[] | null;
}

type UserWithRole = UserProfile & { role: UserRole['role'] | null };

// This new component will fetch the role for a single user
const UserRow = ({ user, onSelect, isSelected }: { user: UserProfile, onSelect: (user: UserProfile) => void, isSelected: boolean }) => {
    const firestore = useFirestore();
    const roleRef = useMemoFirebase(() => firestore ? doc(firestore, 'roles', user.id) : null, [firestore, user.id]);
    const { data: roleDoc, isLoading } = useDoc<UserRole>(roleRef);

    const getRoleDisplayName = (role: UserRole['role'] | null) => {
        if (role === 'admin') return 'Administrador';
        if (role === 'editor') return 'Editor';
        return 'Usuario';
    }

    return (
        <TableRow 
            key={user.uid} 
            onClick={() => onSelect(user)}
            className={isSelected ? 'bg-muted' : 'cursor-pointer'}
        >
            <TableCell>{user.displayName}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
                <span className="flex items-center gap-2">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 
                     (roleDoc?.role === null && <ShieldQuestion size={16} className="text-muted-foreground" />)}
                    {isLoading ? 'Cargando...' : getRoleDisplayName(roleDoc?.role || null)}
                </span>
            </TableCell>
        </TableRow>
    );
};


export default function UserManagementView({ users }: UserManagementViewProps) {
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'editor'>('editor');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const firestore = useFirestore();
    const roleRef = useMemoFirebase(() => (firestore && selectedUser) ? doc(firestore, 'roles', selectedUser.id) : null, [firestore, selectedUser]);
    const { data: roleDoc, isLoading: isRoleLoading } = useDoc<UserRole>(roleRef);

    useEffect(() => {
        if(roleDoc) {
            setSelectedRole(roleDoc.role || 'editor');
        } else if (!selectedUser) {
            setSelectedRole('editor');
        }
    }, [roleDoc, selectedUser]);


    const handleSelectUser = (user: UserProfile) => {
        setSelectedUser(user);
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) { 
            toast({ title: 'Selección inválida', description: 'Por favor, seleccione un usuario.', variant: 'destructive' });
            return;
        }

        const roleToSet = selectedRole;
        
        if (roleToSet === (roleDoc?.role || null)) {
             toast({ title: 'Sin cambios', description: `El usuario ya tiene este rol.` });
            return;
        }

        setIsSubmitting(true);
        const result = await updateUserRole(selectedUser.uid, roleToSet);

        if (result.success) {
            toast({
                title: 'Rol Actualizado',
                description: `El usuario ${selectedUser.email} ahora es ${roleToSet}.`,
            });
        } else {
            toast({
                title: 'Error al Actualizar Rol',
                description: result.error || 'Ocurrió un error inesperado.',
                variant: 'destructive',
            });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Lista de Usuarios</CardTitle>
                    <CardDescription>
                        Seleccione un usuario de la lista para gestionar su rol.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!users ? (
                         <Alert variant="destructive">
                            <UserX className="h-4 w-4" />
                            <AlertTitle>No se pudieron cargar los usuarios</AlertTitle>
                            <AlertDescription>
                                No tienes permisos para listar todos los usuarios. Por favor, contacta al administrador para ajustar las reglas de seguridad de Firestore si necesitas esta funcionalidad.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol Actual</TableHead>
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
                       {selectedUser ? `Gestionando a ${selectedUser.displayName}` : "Seleccione un usuario de la lista."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {!selectedUser ? (
                        <div className="flex items-center justify-center h-48 text-muted-foreground text-center">
                            <p>Seleccione un usuario de la lista para comenzar.</p>
                        </div>
                    ) : (
                    <div className="space-y-4">
                         <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Email del usuario</label>
                            <Input
                                value={selectedUser?.email || ''}
                                readOnly
                                disabled
                                className="flex-grow"
                            />
                        </div>

                         <div className="space-y-1">
                            <label className="text-sm font-medium">Asignar Rol</label>
                             <Select 
                                onValueChange={(value: 'admin' | 'editor') => setSelectedRole(value)} 
                                value={selectedRole} 
                                disabled={isSubmitting || isRoleLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="editor">Editor</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                        <Button 
                            onClick={handleUpdateRole} 
                            disabled={isSubmitting || isRoleLoading || !selectedUser || roleToSet === (roleDoc?.role || null)} 
                            className="w-full"
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {(roleDoc && selectedRole === roleDoc.role) ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
                            {isSubmitting ? 'Asignando...' : (roleDoc && selectedRole === roleDoc.role) ? 'Rol Asignado' : 'Confirmar Cambio'}
                        </Button>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}