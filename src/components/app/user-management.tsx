
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Firestore, collection, doc } from 'firebase/firestore';
import { useCollection, useMemoFirebase } from '@/firebase';
import { UserRole } from '@/lib/types';
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

    // Change from /users to /roles
    const rolesRef = useMemoFirebase(() => collection(firestore, 'roles'), [firestore]);
    const { data: roles, isLoading: isLoadingRoles } = useCollection<UserRole>(rolesRef);

    const handleRoleChange = (userId: string, newRole: 'admin' | 'editor') => {
        const roleRef = doc(firestore, 'roles', userId);
        setDocumentNonBlocking(roleRef, { role: newRole }, { merge: true });
        toast({
            title: "Rol Actualizado",
            description: `El rol del usuario se ha cambiado a ${newRole}.`,
        });
    };
    
    if (isLoadingRoles) {
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
                            <TableHead>ID de Usuario</TableHead>
                            <TableHead>Rol</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles?.sort((a,b) => a.id.localeCompare(b.id)).map(role => {
                            return (
                                <TableRow key={role.id}>
                                    <TableCell className="font-mono">{role.id}</TableCell>
                                    <TableCell>
                                        {currentUser?.uid === role.id ? (
                                            <Badge variant="secondary">{role.role}</Badge>
                                        ) : (
                                            <Select
                                                value={role.role}
                                                onValueChange={(newRole: 'admin' | 'editor') => handleRoleChange(role.id, newRole)}
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
