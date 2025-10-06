
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
import { Bearing, Sector } from "@/lib/types";

type AssignBearingDialogProps = {
  sector: Sector;
  allBearings: Bearing[];
  onClose: () => void;
  onAssign: (bearingId: string, sector: Sector, quantity: number) => void;
};

const AssignBearingSchema = z.object({
  bearingId: z.string({
    required_error: "Por favor seleccione un rodamiento.",
  }),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor que cero."),
});

export default function AssignBearingDialog({
  sector,
  allBearings,
  onClose,
  onAssign,
}: AssignBearingDialogProps) {

  const form = useForm<z.infer<typeof AssignBearingSchema>>({
    resolver: zodResolver(AssignBearingSchema),
    defaultValues: {
      quantity: 1,
    }
  });

  function onSubmit(values: z.infer<typeof AssignBearingSchema>) {
    onAssign(values.bearingId, sector, values.quantity);
    onClose();
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Rodamiento a {sector}</DialogTitle>
          <DialogDescription>
            Seleccione un rodamiento y la cantidad a asignar a este sector.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="bearingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rodamiento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un rodamiento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allBearings.sort((a,b) => a.name.localeCompare(b.name)).map(bearing => (
                        <SelectItem key={bearing.id} value={bearing.id}>
                          {bearing.name} (Stock: {bearing.stock})
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
