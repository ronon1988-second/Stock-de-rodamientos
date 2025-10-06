export const SECTORS = ['Moduus', 'Alipack', 'Horno Linea 1', 'Horno Linea 2', 'Curva', 'Stock General'] as const;
export type Sector = typeof SECTORS[number];

export type Bearing = {
  id: string;
  name: string;
  sector: Sector; // Sector where it is primarily assigned, or 'Stock General'
  stock: number;
  threshold: number;
};

// Represents the usage of a bearing in a specific sector at a specific time
export type UsageLog = {
  id: string;
  bearingId: string;
  bearingName: string;
  quantity: number;
  date: string;
  sector: Sector; // The sector where it was used
};

// Represents the specific bearings and quantities assigned to a machine/sector
export type SectorInventory = {
  sector: Sector;
  bearingId: string;
  quantity: number;
}
