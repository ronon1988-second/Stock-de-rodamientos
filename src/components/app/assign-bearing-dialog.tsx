
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
import { InventoryItem, Sector } from "@/lib/types";

type AssignItemDialogProps = {
  sector: Sector;
  allInventory: InventoryItem[];
  onClose: () => void;
  onAssign: (itemId: string, sector: Sector, quantity: number) => void;
};

const AssignItemSchema = z.object({
  itemId: z.string({
    required_error: "Por favor seleccione un artículo.",
  }),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor que cero."),
});

export default function AssignItemDialog({
  sector,
  allInventory,
  onClose,
  onAssign,
}: AssignItemDialogProps) {

  const form = useForm<z.infer<typeof AssignItemSchema>>({
    resolver: zodResolver(AssignItemSchema),
    defaultValues: {
      quantity: 1,
    }
  });

  function onSubmit(values: z.infer<typeof AssignItemSchema>) {
    onAssign(values.itemId, sector, values.quantity);
    onClose();
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Artículo a {sector}</DialogTitle>
          <DialogDescription>
            Seleccione un artículo y la cantidad a asignar a este sector.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artículo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un artículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allInventory.sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (Stock: {item.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad a Asignar</FormLabel>
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
              <Button type="submit">Asignar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
