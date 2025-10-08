
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
import { updateUserRole, deleteUser } from '@/app/actions';
import type { UserProfile, UserRole } from '@/lib/types';
import { Loader2, ShieldQuestion, UserX, CheckCircle, Shield, User, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type UserManagementViewProps = {
    users: UserProfile[] | null;
}

const UserRow = ({ user, onSelect, isSelected }: { user: UserProfile, onSelect: (user: UserProfile) => void, isSelected: boolean }) => {
    const firestore = useFirestore();
    const roleRef = useMemoFirebase(() => firestore ? doc(firestore, 'roles', user.id) : null, [firestore, user.id]);
    const { data: roleDoc, isLoading } = useDoc<UserRole>(roleRef);

    const getRoleDisplayName = (role: UserRole['role'] | 'user' | undefined | null) => {
        if (role === 'admin') return 'Administrador';
        if (role === 'editor') return 'Editor';
        return 'Usuario';
    }
    
    const getRoleIcon = (role: UserRole['role'] | 'user' | undefined | null) => {
        if (isLoading) return <Loader2 size={16} className="animate-spin" />;
        if (role === 'admin') return <ShieldQuestion size={16} className="text-primary" />;
        if (role === 'editor') return <Shield size={16} className="text-amber-600" />;
        if (role === 'user') return <User size={16} className="text-muted-foreground" />;
        return <ShieldQuestion size={16} className="text-muted-foreground" />;
    }

    return (
        <TableRow 
            key={user.id} 
            onClick={() => onSelect(user)}
            className={isSelected ? 'bg-muted' : 'cursor-pointer'}
        >
            <TableCell>{user.displayName}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
                <span className="flex items-center gap-2">
                    {getRoleIcon(roleDoc?.role)}
                    {isLoading ? 'Cargando...' : getRoleDisplayName(roleDoc?.role)}
                </span>
            </TableCell>
        </TableRow>
    );
};


export default function UserManagementView({ users: initialUsers }: UserManagementViewProps) {
    const { toast } = useToast();
    const [users, setUsers] = useState(initialUsers);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'user'>('user');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const firestore = useFirestore();
    const roleRef = useMemoFirebase(() => (firestore && selectedUser) ? doc(firestore, 'roles', selectedUser.id) : null, [firestore, selectedUser]);
    const { data: roleDoc, isLoading: isRoleLoading } = useDoc<UserRole>(roleRef);

    useEffect(() => {
        if (roleDoc) {
            setSelectedRole(roleDoc.role as 'admin' | 'editor' | 'user');
        } else if (selectedUser) {
            setSelectedRole('user');
        }
    }, [roleDoc, selectedUser]);

    useEffect(() => {
        setUsers(initialUsers);
        if (selectedUser && !initialUsers?.find(u => u.id === selectedUser.id)) {
            setSelectedUser(null);
        }
    }, [initialUsers, selectedUser]);


    const handleSelectUser = (user: UserProfile) => {
        setSelectedUser(user);
    };

    const handleUpdateRole = async () => {
        if (!selectedUser) { 
            toast({ title: 'Selección inválida', description: 'Por favor, seleccione un usuario.', variant: 'destructive' });
            return;
        }
        
        const currentRole = roleDoc?.role || 'user';
        if (selectedRole === currentRole) {
             toast({ title: 'Sin cambios', description: `El usuario ya tiene el rol de '${selectedRole}'.` });
            return;
        }

        setIsSubmitting(true);
        const result = await updateUserRole(selectedUser.id, selectedRole);

        if (result.success) {
            toast({
                title: 'Rol Actualizado',
                description: `El usuario ${selectedUser.email} ahora es ${selectedRole}.`,
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

     const handleDeleteUser = async () => {
        if (!selectedUser) return;
        
        setIsSubmitting(true);
        const result = await deleteUser(selectedUser.id);
        
        if (result.success) {
            toast({
                title: "Usuario Eliminado",
                description: `El usuario ${selectedUser.email} ha sido eliminado.`,
            });
            setSelectedUser(null);
        } else {
            toast({
                title: "Error al Eliminar",
                description: result.error || "No se pudo eliminar el usuario.",
                variant: "destructive",
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
                                No tienes los permisos necesarios para listar todos los usuarios. Por favor, contacta al administrador para ajustar las reglas de seguridad de Firestore si necesitas esta funcionalidad.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="border rounded-md max-h-[60vh] overflow-auto">
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
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Gestionar Usuario</CardTitle>
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
                                onValueChange={(value: 'admin' | 'editor' | 'user') => setSelectedRole(value)} 
                                value={selectedRole} 
                                disabled={isSubmitting || isRoleLoading}
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
                            disabled={isSubmitting || isRoleLoading || !selectedUser || selectedRole === (roleDoc?.role || 'user')} 
                            className="w-full"
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {(roleDoc && selectedRole === roleDoc.role) ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
                            {isSubmitting ? 'Asignando...' : (roleDoc && selectedRole === roleDoc.role) ? 'Rol ya asignado' : 'Confirmar Cambio de Rol'}
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    disabled={isSubmitting || !selectedUser}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar Usuario
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario
                                        <strong className="px-1">{selectedUser.email}</strong>
                                        y todos sus datos asociados.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteUser}>
                                        Sí, eliminar usuario
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
