
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Firestore, collection, doc } from 'firebase/firestore';
import { useCollection, useMemoFirebase } from '@/firebase';
import { UserProfile, UserRole } from '@/lib/types';
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

    const usersRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersRef);

    const rolesRef = useMemoFirebase(() => collection(firestore, 'roles'), [firestore]);
    const { data: roles, isLoading: isLoadingRoles } = useCollection<UserRole>(rolesRef);

    const handleRoleChange = (userId: string, userEmail: string, newRole: 'admin' | 'editor') => {
        const roleRef = doc(firestore, 'roles', userId);
        setDocumentNonBlocking(roleRef, { role: newRole }, { merge: true });
        toast({
            title: "Rol Actualizado",
            description: `El rol de ${userEmail} se ha cambiado a ${newRole}.`,
        });
    };
    
    if (isLoadingUsers || isLoadingRoles) {
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

    const rolesMap = new Map(roles?.map(role => [role.id, role.role]));

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
                        {users?.sort((a,b) => a.email.localeCompare(b.email)).map(user => {
                            const userRole = rolesMap.get(user.id) || 'editor';
                            return (
                                <TableRow key={user.id}>
                                    <TableCell className="font-mono">{user.email}</TableCell>
                                    <TableCell>{user.displayName}</TableCell>
                                    <TableCell>
                                        {currentUser?.uid === user.id ? (
                                            <Badge variant="secondary">{userRole}</Badge>
                                        ) : (
                                            <Select
                                                value={userRole}
                                                onValueChange={(newRole: 'admin' | 'editor') => handleRoleChange(user.id, user.email, newRole)}
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
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

    