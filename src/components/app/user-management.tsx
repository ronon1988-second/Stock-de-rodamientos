
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Firestore, collection, doc } from 'firebase/firestore';
import { useCollection, useMemoFirebase } from '@/firebase';
import { UserRole, UserProfile } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import { User } from 'firebase/auth';

type UserManagementViewProps = {
    firestore: Firestore;
    currentUser: User | null;
};

export default function UserManagementView({ firestore, currentUser }: UserManagementViewProps) {
    const { toast } = useToast();

    // TEMPORARILY DISABLED TO PREVENT CRASH
    // const rolesRef = useMemoFirebase(() => collection(firestore, 'roles'), [firestore]);
    // const { data: roles, isLoading: isLoadingRoles } = useCollection<UserRole>(rolesRef);

    // const usersRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
    // const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersRef);
    const roles: UserRole[] = [];
    const users: UserProfile[] = [];
    const isLoadingRoles = false;
    const isLoadingUsers = false;


    const handleRoleChange = (userId: string, newRole: 'admin' | 'editor') => {
        const roleRef = doc(firestore, 'roles', userId);
        setDocumentNonBlocking(roleRef, { role: newRole }, { merge: true });
        toast({
            title: "Rol Actualizado",
            description: `El rol del usuario se ha cambiado a ${newRole}.`,
        });
    };

    const combinedUsers = React.useMemo(() => {
        if (!roles || !users) return [];
        return users.map(user => {
            const userRole = roles.find(r => r.id === user.uid);
            return {
                ...user,
                role: userRole?.role || 'editor', // Default to editor if no role found
            };
        }).sort((a,b) => (a.displayName || '').localeCompare(b.displayName || ''));
    }, [roles, users]);
    
    if (isLoadingRoles || isLoadingUsers) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestionar Usuarios</CardTitle>
                <CardDescription>
                    Asigne roles a los usuarios para controlar sus permisos dentro de la aplicación.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Rol</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {combinedUsers.length > 0 ? (
                            combinedUsers.map(user => {
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="font-medium">{user.displayName}</TableCell>
                                        <TableCell>
                                            {currentUser?.uid === user.uid ? (
                                                <Badge variant="secondary">{user.role}</Badge>
                                            ) : (
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(newRole: 'admin' | 'editor') => handleRoleChange(user.uid, newRole)}
                                                >
                                                    <SelectTrigger className="w-[120px]">
                                                        <SelectValue placeholder="Seleccionar rol" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="editor">Editor</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No hay otros usuarios para mostrar.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
