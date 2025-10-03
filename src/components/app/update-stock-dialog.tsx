"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Bearing } from "@/lib/types";

type UpdateStockDialogProps = {
  bearing: Bearing;
  onClose: () => void;
  onConfirm: (bearingId: string, quantity: number) => void;
};

export default function UpdateStockDialog({
  bearing,
  onClose,
  onConfirm,
}: UpdateStockDialogProps) {
  const formSchema = z.object({
    quantity: z.coerce
      .number()
      .int()
      .positive("La cantidad debe ser positiva.")
      .max(bearing.stock, `No se puede usar más que el stock disponible (${bearing.stock}).`),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onConfirm(bearing.id, values.quantity);
    onClose();
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Uso para {bearing.name}</DialogTitle>
          <DialogDescription>
            Ingrese la cantidad de rodamientos utilizados. Esto actualizará el nivel de stock.
            Stock actual: {bearing.stock}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Cantidad</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage className="pt-2" />
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit">Confirmar Uso</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
