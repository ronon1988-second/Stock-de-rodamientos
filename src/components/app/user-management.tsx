
"use client";

import React, { useState, useCallback } from 'react';
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
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

type UserManagementViewProps = {
    firestore: Firestore;
    currentUser: User | null;
};

export default function UserManagementView({ firestore, currentUser }: UserManagementViewProps) {
    const { toast } = useToast();
    const [shouldLoad, setShouldLoad] = useState(false);

    // Memoize references only when shouldLoad is true
    const rolesRef = useMemoFirebase(() => shouldLoad ? collection(firestore, 'roles') : null, [firestore, shouldLoad]);
    const { data: roles, isLoading: isLoadingRoles } = useCollection<UserRole>(rolesRef);

    const usersRef = useMemoFirebase(() => shouldLoad ? collection(firestore, 'users') : null, [firestore, shouldLoad]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersRef);

    const handleLoadClick = useCallback(() => {
        setShouldLoad(true);
    }, []);
    
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
    
    const isLoading = isLoadingRoles || isLoadingUsers;

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle>Gestionar Usuarios</CardTitle>
                    <CardDescription>
                        Asigne roles a los usuarios para controlar sus permisos dentro de la aplicación.
                    </CardDescription>
                </div>
                 {!shouldLoad && (
                    <Button onClick={handleLoadClick}>Cargar Usuarios</Button>
                )}
            </CardHeader>
            <CardContent>
                {shouldLoad ? (
                    isLoading ? (
                         <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                         </div>
                    ) : (
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
                    )
                ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                        Haga clic en "Cargar Usuarios" para ver y gestionar los roles.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
