export type Sector = 'Envasadora 1' | 'Envasadora 2' | 'Línea de Galletitas';

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
