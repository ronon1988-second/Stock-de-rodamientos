
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
import { useForm, Controller } from "react-hook-form";
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
import React from "react";

type UpdateStockDialogProps = {
  item: InventoryItem;
  onClose: () => void;
  onConfirm: (itemId: string, quantityOrStock: number, threshold?: number, machineId?: string | null, sectorId?: string | null) => void;
  mode: "logUsage" | "updateStock";
  sectors?: Sector[];
  machinesBySector?: Record<string, Machine[]>;
  defaultValues?: {
    sectorId?: string;
    machineId?: string;
  };
};

const GENERAL_USAGE_ID = "general";

export default function UpdateStockDialog({
  item,
  onClose,
  onConfirm,
  mode,
  sectors = [],
  machinesBySector = {},
  defaultValues = {},
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
    threshold: z.coerce.number().int().min(0, "El umbral no puede ser negativo."),
  });

  const formSchema = mode === 'logUsage' ? logUsageSchema : updateStockSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: mode === 'logUsage' ? {
      quantity: 1,
      sectorId: defaultValues.sectorId ?? undefined,
      machineId: defaultValues.machineId ?? undefined,
    } : {
      stock: item.stock,
      threshold: item.threshold,
    },
  });

  const selectedSectorId = form.watch('sectorId' as any);

  // Reset machineId when sectorId changes
  React.useEffect(() => {
    if (mode === 'logUsage' && !defaultValues.machineId) {
        form.setValue('machineId' as any, undefined);
    }
  }, [selectedSectorId, form, mode, defaultValues.machineId]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    if (mode === 'logUsage') {
      let { quantity, machineId, sectorId } = values as z.infer<typeof logUsageSchema>;
      // Handle "General Usage" selection
      const finalSectorId = sectorId === GENERAL_USAGE_ID ? null : sectorId;
      const finalMachineId = machineId === GENERAL_USAGE_ID ? null : machineId;
      onConfirm(item.id, quantity, undefined, finalMachineId, finalSectorId);
    } else {
      const { stock, threshold } = values as z.infer<typeof updateStockSchema>;
      onConfirm(item.id, stock, threshold);
    }
    onClose();
  }
  
  const isLogUsage = mode === 'logUsage';

  const availableMachines = selectedSectorId && selectedSectorId !== GENERAL_USAGE_ID
    ? machinesBySector[selectedSectorId] || []
    : [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLogUsage ? 'Registrar Uso' : 'Actualizar Artículo'} de {item.name}</DialogTitle>
          <DialogDescription>
             {isLogUsage 
                ? 'Seleccione la máquina e ingrese la cantidad utilizada.' 
                : 'Ingrese el nuevo total de stock y el umbral de seguridad para este artículo.'}
             <br />
             Stock actual: <strong>{item.stock} unidades</strong>
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
                          <SelectItem value={GENERAL_USAGE_ID}>Uso General / No especificado</SelectItem>
                          {sectors.map(sector => (
                            <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="machineId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Máquina</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSectorId}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Seleccione una máquina" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedSectorId === GENERAL_USAGE_ID ? (
                                <SelectItem value={GENERAL_USAGE_ID}>No especificado</SelectItem>
                            ) : (
                                availableMachines.map(machine => (
                                    <SelectItem key={machine.id} value={machine.id}>{machine.name}</SelectItem>
                                ))
                            )}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                </>
            )}
            {!isLogUsage && (
                <div className="grid grid-cols-2 gap-4">
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
                 <FormField
                  control={form.control}
                  name="threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Umbral de Seguridad</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
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


    



    