
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
import { updateUserRoleByEmail } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';


const UserRoleSchema = z.object({
  email: z.string().email({ message: 'Por favor ingrese un email válido.' }),
  role: z.enum(['admin', 'editor'], {
    required_error: 'Por favor seleccione un rol.',
  }),
});

type UserRoleFormValues = z.infer<typeof UserRoleSchema>;

type UserManagementViewProps = {
  onRoleChanged: () => void;
};


export default function UserManagementView({ onRoleChanged }: UserManagementViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

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
          description: `El usuario ${data.email} ahora tiene el rol de ${data.role}. El cambio se reflejará al reiniciar la sesión.`,
        });
        
        // If the admin is changing their own role, trigger the refresh callback
        // which should handle token refresh logic in the parent.
        if (user && user.email === data.email) {
            onRoleChanged();
        }

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
          Asigne un rol a un usuario específico utilizando su dirección de correo electrónico. Los cambios pueden tardar unos momentos en reflejarse.
        </CardDescription>
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
  );
}
