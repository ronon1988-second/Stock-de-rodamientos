"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bearing, SECTORS } from "@/lib/types";

type AddBearingDialogProps = {
  bearing?: Bearing;
  onClose: () => void;
  onConfirm: (data: Omit<Bearing, 'id'> | Bearing) => void;
};

const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  sector: z.enum(SECTORS, {
    errorMap: () => ({ message: "Por favor seleccione un sector." }),
  }),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo."),
  threshold: z.coerce.number().int().min(0, "El umbral no puede ser negativo."),
});

export default function AddBearingDialog({
  bearing,
  onClose,
  onConfirm,
}: AddBearingDialogProps) {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bearing?.name || "",
      sector: bearing?.sector,
      stock: bearing?.stock || 0,
      threshold: bearing?.threshold || 10,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (bearing) {
      onConfirm({ ...bearing, ...values });
    } else {
      onConfirm(values);
    }
    onClose();
  }
  
  const isEditing = bearing !== undefined;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Rodamiento' : 'Añadir Nuevo Rodamiento'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Actualice los detalles de este rodamiento.' : 'Ingrese los detalles para el nuevo rodamiento.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Rodamiento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 6203-2RS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un sector" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SECTORS.map(sector => (
                        <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Inicial</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Umbral de Stock Bajo</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit">{isEditing ? 'Guardar Cambios' : 'Añadir Rodamiento'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
