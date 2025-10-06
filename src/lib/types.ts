export const SECTORS = ['Moduus', 'Alipack', 'Horno Linea 1', 'Horno Linea 2', 'Curva'] as const;
export type Sector = typeof SECTORS[number];

export type Bearing = {
  id: string;
  name: string;
  // The 'sector' property is removed from Bearing, as stock is now centralized.
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

// Represents the specific bearings assigned to a machine/sector (Bill of Materials)
export type SectorInventory = {
  id: string; // Unique ID for the assignment
  sector: Sector;
  bearingId: string;
  bearingName: string;
  // Quantity here could mean "quantity installed in this machine"
  // For now, we'll just map the bearing. The logic can be extended.
};
