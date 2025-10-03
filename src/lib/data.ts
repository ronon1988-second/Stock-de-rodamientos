import { Bearing } from './types';

export const initialBearings: Bearing[] = [
  { id: 'b001', name: '6203-2RS', sector: 'Envasadora 1', stock: 50, threshold: 10 },
  { id: 'b002', name: '6204-2RS', sector: 'Envasadora 1', stock: 45, threshold: 10 },
  { id: 'b003', name: '6205-2Z', sector: 'Envasadora 2', stock: 30, threshold: 15 },
  { id: 'b004', name: '6001-2RS', sector: 'Envasadora 2', stock: 60, threshold: 20 },
  { id: 'b005', name: '6305-2RS', sector: 'Línea de Galletitas', stock: 22, threshold: 5 },
  { id: 'b006', name: '6306-2Z', sector: 'Línea de Galletitas', stock: 18, threshold: 5 },
  { id: 'b007', name: 'UC205', sector: 'Línea de Galletitas', stock: 40, threshold: 10 },
  { id: 'b008', name: 'UC206', sector: 'Línea de Galletitas', stock: 35, threshold: 10 },
  { id: 'b009', name: '608-2Z', sector: 'Envasadora 1', stock: 8, threshold: 15 },
  { id: 'b010', name: '627-2Z', sector: 'Envasadora 2', stock: 12, threshold: 10 },
];
