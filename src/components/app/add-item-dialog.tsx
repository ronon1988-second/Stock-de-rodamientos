
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
import type { InventoryItem } from "@/lib/types";

type AddItemDialogProps = {
  onClose: () => void;
  onConfirm: (item: Omit<InventoryItem, 'id'>) => void;
  existingNames: string[];
};

export default function AddItemDialog({ onClose, onConfirm, existingNames }: AddItemDialogProps) {

  const AddItemSchema = z.object({
    name: z.string().trim().min(1, "El nombre es requerido.").refine(
        (name) => !existingNames.map(n => n.toLowerCase()).includes(name.toLowerCase()),
        "Este código de artículo ya existe."
    ),
    stock: z.coerce.number().int().min(0, "El stock no puede ser negativo."),
    threshold: z.coerce.number().int().min(0, "El umbral no puede ser negativo."),
  });

  const form = useForm<z.infer<typeof AddItemSchema>>({
    resolver: zodResolver(AddItemSchema),
    defaultValues: {
      name: "",
      stock: 0,
      threshold: 2,
    },
  });

  function onSubmit(values: z.infer<typeof AddItemSchema>) {
    onConfirm(values);
    onClose();
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Artículo al Inventario</DialogTitle>
          <DialogDescription>
            Ingrese los detalles del nuevo artículo para agregarlo al inventario general.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre / Código del Artículo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 6205 ZZ" {...field} />
                  </FormControl>
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
                  <FormLabel>Umbral de Stock de Seguridad</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Agregar Artículo</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
