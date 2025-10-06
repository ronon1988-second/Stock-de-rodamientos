export const SECTORS = ['Modulus', 'Alipack', 'Horno Linea 1', 'Horno Linea 2', 'Curva', 'Laminado L1', 'Laminado L2'] as const;
export type Sector = typeof SECTORS[number];

// Represents a single item in the shared inventory. The 'id' is the Firestore document ID.
export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  threshold: number;
};

// Represents the usage of an item in a specific sector at a specific time. The 'id' is the Firestore document ID.
export type UsageLog = {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  date: string; // ISO string
  sector: Sector; 
};

// Represents the assignment of items to a sector. The 'id' is the Firestore document ID.
export type SectorAssignment = {
  id: string;
  sector: Sector;
  itemId: string;
  itemName: string;
  quantity: number;
};
