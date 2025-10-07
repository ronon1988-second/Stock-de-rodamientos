
"use client";

import React, { useState } from 'react';
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
import { updateUserRole } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';


const UserRoleSchema = z.object({
  email: z.string().email({ message: 'Por favor ingrese un email válido.' }),
  role: z.enum(['admin', 'editor'], {
    required_error: 'Por favor seleccione un rol.',
  }),
});

type UserRoleFormValues = z.infer<typeof UserRoleSchema>;

export default function UserManagementView({ isAdmin }: { isAdmin: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<UserRoleFormValues>({
    resolver: zodResolver(UserRoleSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: UserRoleFormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Find the user's UID from the 'users' collection based on their email.
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where("email", "==", data.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No se encontró ningún usuario con ese correo electrónico.");
      }

      const userDoc = querySnapshot.docs[0];
      const uid = userDoc.id;

      // 2. Call the server action with the UID and role.
      const result = await updateUserRole(uid, data.role);
      
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Roles de Usuario</CardTitle>
        <CardDescription>
          Asigne un rol a un usuario específico utilizando su dirección de correo electrónico.
        </CardDescription>
      </CardHeader>
      <CardContent>
            {!isAdmin && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTitle>Acceso de solo lectura</AlertTitle>
                    <AlertDescription>
                        Como editor, puede ver esta página, pero solo un administrador puede asignar o cambiar roles.
                    </AlertDescription>
                </Alert>
            )}
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
                <Button type="submit" disabled={isSubmitting || !isAdmin}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Asignar Rol
                </Button>
              </form>
            </Form>
      </CardContent>
    </Card>
  );
}
