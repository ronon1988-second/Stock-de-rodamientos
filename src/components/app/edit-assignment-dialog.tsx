
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
import { Textarea } from "@/components/ui/textarea";
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
import type { MachineAssignment } from "@/lib/types";

type EditAssignmentDialogProps = {
  assignment: MachineAssignment;
  onClose: () => void;
  onConfirm: (assignmentId: string, newQuantity: number, newDescription: string) => void;
};

const EditAssignmentSchema = z.object({
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor que cero."),
  usageDescription: z.string().optional(),
});

export default function EditAssignmentDialog({
  assignment,
  onClose,
  onConfirm,
}: EditAssignmentDialogProps) {
  const form = useForm<z.infer<typeof EditAssignmentSchema>>({
    resolver: zodResolver(EditAssignmentSchema),
    defaultValues: {
      quantity: assignment.quantity,
      usageDescription: assignment.usageDescription || "",
    },
  });

  function onSubmit(values: z.infer<typeof EditAssignmentSchema>) {
    onConfirm(assignment.id, values.quantity, values.usageDescription || "");
    onClose();
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Asignación para {assignment.itemName}</DialogTitle>
          <DialogDescription>
            Actualice la cantidad y la descripción de uso para este artículo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad Asignada</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usageDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción de Uso (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Rodillo de cama centradora" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
