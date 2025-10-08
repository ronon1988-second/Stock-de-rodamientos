
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { InventoryItem, Sector, Machine } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";


type AssignItemDialogProps = {
  sector: Sector;
  machine: Machine;
  allInventory: InventoryItem[];
  onClose: () => void;
  onAssign: (itemId: string, machineId: string, sectorId: string, quantity: number) => void;
};

const AssignItemSchema = z.object({
  itemId: z.string({
    required_error: "Por favor seleccione un artículo.",
  }),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor que cero."),
});

export default function AssignItemDialog({
  sector,
  machine,
  allInventory,
  onClose,
  onAssign,
}: AssignItemDialogProps) {
  const [open, setOpen] = React.useState(false);
  const form = useForm<z.infer<typeof AssignItemSchema>>({
    resolver: zodResolver(AssignItemSchema),
    defaultValues: {
      quantity: 1,
    }
  });

  function onSubmit(values: z.infer<typeof AssignItemSchema>) {
    onAssign(values.itemId, machine.id, sector.id, values.quantity);
    onClose();
  }

  const inventoryOptions = allInventory.sort((a,b) => a.name.localeCompare(b.name)).map(item => ({
      value: item.id,
      label: `${item.name} (Stock: ${item.stock})`,
  }));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Artículo a {machine.name}</DialogTitle>
          <DialogDescription>
            Seleccione un artículo y la cantidad a asignar a esta máquina en el sector {sector.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Artículo</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? inventoryOptions.find(
                                (option) => option.value === field.value
                              )?.label
                            : "Seleccione un artículo"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[430px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar artículo..." />
                        <CommandList>
                            <CommandEmpty>No se encontró ningún artículo.</CommandEmpty>
                            <CommandGroup>
                            {inventoryOptions.map((option) => (
                                <CommandItem
                                value={option.label}
                                key={option.value}
                                onSelect={() => {
                                    form.setValue("itemId", option.value)
                                    setOpen(false)
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    option.value === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                />
                                {option.label}
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
