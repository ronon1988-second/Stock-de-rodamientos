export const SECTORS = ['Moduus', 'Alipack', 'Horno Linea 1', 'Horno Linea 2', 'Curva', 'Stock General'] as const;
export type Sector = typeof SECTORS[number];

export type Bearing = {
  id: string;
  name: string;
  sector: Sector;
  stock: number;
  threshold: number;
};

export type UsageLog = {
  id: string;
  bearingId: string;
  bearingName: string;
  quantity: number;
  date: string;
  sector: Sector;
};
