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
import { Bearing, SECTORS, Sector } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UpdateStockDialogProps = {
  bearing: Bearing;
  onClose: () => void;
  onConfirm: (bearingId: string, quantity: number, sector?: Sector) => void;
  mode: "logUsage" | "updateStock";
};

export default function UpdateStockDialog({
  bearing,
  onClose,
  onConfirm,
  mode
}: UpdateStockDialogProps) {

  const logUsageSchema = z.object({
    quantity: z.coerce
      .number()
      .int()
      .positive("La cantidad debe ser positiva.")
      .max(bearing.stock, `No se puede usar más que el stock disponible (${bearing.stock}).`),
    sector: z.enum(SECTORS, {
      errorMap: () => ({ message: "Por favor seleccione un sector." }),
    }),
  });

  const updateStockSchema = z.object({
    stock: z.coerce.number().int().min(0, "El stock no puede ser negativo."),
  });

  const formSchema = mode === 'logUsage' ? logUsageSchema : updateStockSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: mode === 'logUsage' ? {
      quantity: 1,
      sector: undefined,
    } : {
      stock: bearing.stock,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (mode === 'logUsage') {
      const { quantity, sector } = values as z.infer<typeof logUsageSchema>;
      onConfirm(bearing.id, quantity, sector);
    } else {
      const { stock } = values as z.infer<typeof updateStockSchema>;
      onConfirm(bearing.id, stock);
    }
    onClose();
  }
  
  const isLogUsage = mode === 'logUsage';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLogUsage ? 'Registrar Uso' : 'Actualizar Stock'} de {bearing.name}</DialogTitle>
          <DialogDescription>
             {isLogUsage 
                ? 'Seleccione el sector e ingrese la cantidad utilizada.' 
                : 'Ingrese el nuevo total de stock para este rodamiento.'}
             <br />
             Stock actual: <strong>{bearing.stock} unidades</strong>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            {isLogUsage && (
                <>
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad Utilizada</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
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
                      <FormLabel>Sector de Destino</FormLabel>
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
                </>
            )}
            {!isLogUsage && (
                 <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuevo Stock Total</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
           
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit">Confirmar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
