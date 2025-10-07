
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateUserRoleByEmail } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import { UserProfile, UserRole } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const UserRoleSchema = z.object({
  email: z.string().email({ message: 'Por favor ingrese un email válido.' }),
  role: z.enum(['admin', 'editor'], {
    required_error: 'Por favor seleccione un rol.',
  }),
});

type UserRoleFormValues = z.infer<typeof UserRoleSchema>;

type CombinedUser = UserProfile & { role?: 'admin' | 'editor' };

export default function UserManagementView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const usersRef = useMemoFirebase(
    () => (shouldLoad ? collection(firestore, 'users') : null),
    [firestore, shouldLoad]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersRef);

  const rolesRef = useMemoFirebase(
    () => (shouldLoad ? collection(firestore, 'roles') : null),
    [firestore, shouldLoad]
  );
  const { data: roles, isLoading: isLoadingRoles } = useCollection<UserRole>(rolesRef);

  const form = useForm<UserRoleFormValues>({
    resolver: zodResolver(UserRoleSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: UserRoleFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await updateUserRoleByEmail(data.email, data.role);
      if (result.success) {
        toast({
          title: 'Rol Actualizado',
          description: `El usuario ${data.email} ahora tiene el rol de ${data.role}.`,
        });
        form.reset();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar el rol',
        description:
          error.message ||
          'No se pudo encontrar al usuario o no se pudo actualizar el rol.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const combinedUsers: CombinedUser[] = useMemo(() => {
    if (!users) return [];
    const rolesMap = new Map(roles?.map(role => [role.id, role.role]));
    return users.map(user => ({
      ...user,
      role: rolesMap.get(user.uid),
    })).sort((a,b) => (a.displayName || '').localeCompare(b.displayName || ''));
  }, [users, roles]);

  const isLoading = isLoadingUsers || isLoadingRoles;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Roles de Usuario</CardTitle>
        <CardDescription>
          Asigne un rol a un usuario específico y vea los roles actuales de
          todos los usuarios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card className="bg-muted/40">
          <CardHeader>
            <CardTitle className="text-lg">Asignar Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex items-end gap-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Email del Usuario</FormLabel>
                      <FormControl>
                        <Input placeholder="usuario@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuevo Rol</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccione un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Asignar Rol
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div>
          <CardTitle className="text-lg mb-2">Usuarios Registrados</CardTitle>
          {!shouldLoad ? (
            <div className="flex justify-center items-center h-48 border-2 border-dashed rounded-lg">
                <Button onClick={() => setShouldLoad(true)}>Cargar Lista de Usuarios</Button>
            </div>
          ) : (
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Rol</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                            <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && combinedUsers.map(user => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.displayName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="text-center">
                        {user.role ? (
                            <Badge
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                            >
                            {user.role}
                            </Badge>
                        ) : (
                            <span className="text-muted-foreground italic text-xs">
                            (sin rol)
                            </span>
                        )}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
