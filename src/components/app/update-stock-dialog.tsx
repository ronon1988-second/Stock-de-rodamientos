
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
import { InventoryItem, Machine, Sector } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UpdateStockDialogProps = {
  item: InventoryItem;
  onClose: () => void;
  onConfirm: (itemId: string, quantity: number, machineId?: string, sectorId?: string) => void;
  mode: "logUsage" | "updateStock";
  sectors?: Sector[];
  machinesBySector?: Record<string, Machine[]>;
};

export default function UpdateStockDialog({
  item,
  onClose,
  onConfirm,
  mode,
  sectors,
  machinesBySector,
}: UpdateStockDialogProps) {

  const logUsageSchema = z.object({
    quantity: z.coerce
      .number()
      .int()
      .positive("La cantidad debe ser positiva.")
      .max(item.stock, `No se puede usar más que el stock disponible (${item.stock}).`),
    sectorId: z.string({ required_error: "Por favor seleccione un sector." }),
    machineId: z.string({ required_error: "Por favor seleccione una máquina." }),
  });

  const updateStockSchema = z.object({
    stock: z.coerce.number().int().min(0, "El stock no puede ser negativo."),
  });

  const formSchema = mode === 'logUsage' ? logUsageSchema : updateStockSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: mode === 'logUsage' ? {
      quantity: 1,
      sectorId: undefined,
      machineId: undefined,
    } : {
      stock: item.stock,
    },
  });

  const selectedSectorId = form.watch('sectorId' as any);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (mode === 'logUsage') {
      const { quantity, machineId, sectorId } = values as z.infer<typeof logUsageSchema>;
      onConfirm(item.id, quantity, machineId, sectorId);
    } else {
      const { stock } = values as z.infer<typeof updateStockSchema>;
      onConfirm(item.id, stock);
    }
    onClose();
  }
  
  const isLogUsage = mode === 'logUsage';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLogUsage ? 'Registrar Uso' : 'Actualizar Stock'} de {item.name}</DialogTitle>
          <DialogDescription>
             {isLogUsage 
                ? 'Seleccione la máquina e ingrese la cantidad utilizada.' 
                : 'Ingrese el nuevo total de stock para este artículo.'}
             <br />
             Stock actual: <strong>{item.stock} unidades</strong>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            {isLogUsage && sectors && machinesBySector && (
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
                  name="sectorId"
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
                          {sectors.map(sector => (
                            <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedSectorId && (
                    <FormField
                    control={form.control}
                    name="machineId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Máquina</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedSectorId}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione una máquina" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {(machinesBySector[selectedSectorId] || []).map(machine => (
                                <SelectItem key={machine.id} value={machine.id}>{machine.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
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
