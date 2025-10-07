
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateUserRoleByEmail } from '@/app/actions';
import { Loader2 } from 'lucide-react';

const UserRoleSchema = z.object({
  email: z.string().email({ message: 'Por favor ingrese un email válido.' }),
  role: z.enum(['admin', 'editor'], { required_error: 'Por favor seleccione un rol.' }),
});

type UserRoleFormValues = z.infer<typeof UserRoleSchema>;

export default function UserManagementView() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserRoleFormValues>({
    resolver: zodResolver(UserRoleSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: UserRoleFormValues) => {
    setIsLoading(true);
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
        description: error.message || 'No se pudo encontrar al usuario o no se pudo actualizar el rol.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Rol de Usuario</CardTitle>
        <CardDescription>
          Asigne un rol a un usuario específico ingresando su dirección de correo electrónico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Asignar Rol
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

