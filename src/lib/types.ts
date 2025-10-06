export const SECTORS = ['Modulus', 'Alipack', 'Horno Linea 1', 'Horno Linea 2', 'Curva', 'Laminado L1', 'Laminado L2'] as const;
export type Sector = typeof SECTORS[number];

// Renamed from Bearing to be more generic
export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  threshold: number;
};

// Represents the usage of an item in a specific sector at a specific time
export type UsageLog = {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  date: string;
  sector: Sector; // The sector where it was used
};

// Represents the specific items assigned to a machine/sector (Bill of Materials)
export type SectorAssignment = {
  id: string; // Unique ID for the assignment
  sector: Sector;
  itemId: string;
  itemName: string;
  quantity: number; // Quantity installed in this machine/sector
};
