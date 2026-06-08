/**
 * PASO 2: Lista oficial de categorías para los artículos del inventario.
 */
export const ITEM_CATEGORIES = [
  "Rodamientos 60xx",
  "Rodamientos 62xx",
  "Rodamientos 63xx",
  "Rodamientos Autoalineables",
  "Rodamientos Cónicos",
  "Rodamientos UC (Insertos)",
  "Rodamientos de Aguja",
  "Terminales de Rótula",
  "Pistones",
  "Soportes",
  "Correas",
  "Manguitos de Montaje",
  "Bandas Transportadoras",
  "Otros"
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];
