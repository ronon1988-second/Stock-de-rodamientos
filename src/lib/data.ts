import { InventoryItem, Sector, Machine } from './types';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

// This data is now only used for one-time seeding if the database is empty.
// The main application will read from Firestore directly.

export const initialSectors: Omit<Sector, 'id'>[] = [
    { name: 'Sector A' },
    { name: 'Sector B' },
    { name: 'Prensado' },
];

export const initialMachines: (Omit<Machine, 'id' | 'sectorId'> & { sectorName: string })[] = [
    { name: 'Máquina 1', sectorName: 'Sector A' },
    { name: 'Máquina 2', sectorName: 'Sector A' },
    { name: 'Máquina 3', sectorName: 'Sector B' },
    { name: 'Prensa 1', sectorName: 'Prensado' },
];


export const initialInventory: Omit<InventoryItem, 'id'>[] = [
  { name: '698', stock: 0, threshold: 2 },
  { name: '6000', stock: 0, threshold: 2 },
  { name: '6001', stock: 0, threshold: 2 },
  { name: '6002', stock: 0, threshold: 2 },
  { name: '6002 ZZ', stock: 0, threshold: 2 },
  { name: '6003', stock: 0, threshold: 2 },
  { name: '6004', stock: 0, threshold: 2 },
  { name: '6005', stock: 0, threshold: 2 },
  { name: '6005 ZZ', stock: 0, threshold: 2 },
  { name: '6006', stock: 0, threshold: 2 },
  { name: '6007', stock: 0, threshold: 2 },
  { name: '6008', stock: 0, threshold: 2 },
  { name: '6009', stock: 0, threshold: 2 },
  { name: '6200', stock: 0, threshold: 2 },
  { name: '6201', stock: 0, threshold: 2 },
  { name: '6202', stock: 0, threshold: 2 },
  { name: '6202C3 ZZ', stock: 0, threshold: 2 },
  { name: '6203', stock: 0, threshold: 2 },
  { name: '6203 ZZ', stock: 0, threshold: 2 },
  { name: '6204', stock: 0, threshold: 2 },
  { name: '6205', stock: 0, threshold: 2 },
  { name: '6206', stock: 0, threshold: 2 },
  { name: '6207', stock: 0, threshold: 2 },
  { name: '6208', stock: 0, threshold: 2 },
  { name: '6208 ZZ C3', stock: 0, threshold: 2 },
  { name: '6209', stock: 0, threshold: 2 },
  { name: '6210', stock: 0, threshold: 2 },
  { name: '6211', stock: 0, threshold: 2 },
  { name: '6212', stock: 0, threshold: 2 },
  { name: '6300', stock: 0, threshold: 2 },
  { name: '6301', stock: 0, threshold: 2 },
  { name: '6302', stock: 0, threshold: 2 },
  { name: '6303', stock: 0, threshold: 2 },
  { name: '6304', stock: 0, threshold: 2 },
  { name: '6305', stock: 0, threshold: 2 },
  { name: '6306', stock: 0, threshold: 2 },
  { name: '6307', stock: 0, threshold: 2 },
  { name: '6308', stock: 0, threshold: 2 },
  { name: '6309', stock: 0, threshold: 2 },
  { name: '6903', stock: 0, threshold: 2 },
  { name: 'FL 002', stock: 0, threshold: 2 },
  { name: 'UC 201', stock: 0, threshold: 2 },
  { name: 'UC 202', stock: 0, threshold: 2 },
  { name: 'UC 203', stock: 0, threshold: 2 },
  { name: 'UC 204', stock: 0, threshold: 2 },
  { name: 'UC 205', stock: 0, threshold: 2 },
  { name: 'UC 206', stock: 0, threshold: 2 },
  { name: 'UC 207', stock: 0, threshold: 2 },
  { name: 'UC 208', stock: 0, threshold: 2 },
  { name: 'UC 209', stock: 0, threshold: 2 },
  { name: 'UC 210', stock: 0, threshold: 2 },
  { name: 'UC 212', stock: 0, threshold: 2 },
  { name: 'UC 214', stock: 0, threshold: 2 },
  { name: '1203', stock: 0, threshold: 2 },
  { name: '1204', stock: 0, threshold: 2 },
  { name: '1205', stock: 0, threshold: 2 },
  { name: '1207', stock: 0, threshold: 2 },
  { name: '1209', stock: 0, threshold: 2 },
  { name: '2207', stock: 0, threshold: 2 },
  { name: '2209', stock: 0, threshold: 2 },
  { name: '2212', stock: 0, threshold: 2 },
  { name: '20124', stock: 0, threshold: 2 },
  { name: '22211', stock: 0, threshold: 2 },
  { name: '22208', stock: 0, threshold: 2 },
  { name: 'NK 21/20', stock: 0, threshold: 2 },
  { name: 'RNA4905', stock: 0, threshold: 2 },
  { name: 'NK 17/16', stock: 0, threshold: 2 },
  { name: 'NK 28/20R', stock: 0, threshold: 2 },
  { name: '25X20X17', stock: 0, threshold: 2 },
  { name: 'NK21/16 R17/21/20', stock: 0, threshold: 2 },
  { name: '6902', stock: 0, threshold: 2 },
  { name: 'HK 3038z', stock: 0, threshold: 2 },
  { name: 'H309', stock: 0, threshold: 2 },
  { name: 'H307', stock: 0, threshold: 2 },
  { name: '3308', stock: 0, threshold: 2 },
  { name: 'HK 16/20', stock: 0, threshold: 2 },
  { name: 'RNA 6902', stock: 0, threshold: 2 },
  { name: 'TAF 283720', stock: 0, threshold: 2 },
  { name: 'PHS B4', stock: 0, threshold: 2 },
  { name: 'PHS B4L', stock: 0, threshold: 2 },
  { name: 'PHS B5L', stock: 0, threshold: 2 },
  { name: 'PHS B5', stock: 0, threshold: 2 },
  { name: 'PHS 10', stock: 0, threshold: 2 },
  { name: 'PHS 10L', stock: 0, threshold: 2 },
  { name: 'POS 10', stock: 0, threshold: 2 },
  { name: 'POS 10L', stock: 0, threshold: 2 },
  { name: '30203', stock: 0, threshold: 2 },
  { name: '30206', stock: 0, threshold: 2 },
  { name: '30207', stock: 0, threshold: 2 },
  { name: '30208', stock: 0, threshold: 2 },
  { name: '30209', stock: 0, threshold: 2 },
  { name: '30210', stock: 0, threshold: 2 },
  { name: '32010', stock: 0, threshold: 2 },
  { name: 'LM 25 UU', stock: 0, threshold: 2 },
  { name: '1207kc4', stock: 0, threshold: 2 },
  // Modulus - Correas
  { name: 'HTD-740-5M (26mm)', stock: 0, threshold: 2 },
  { name: 'HTD-6005M (15mm) X2', stock: 0, threshold: 2 },
  { name: 'HTD-750-5M', stock: 0, threshold: 2 },
  { name: 'HTD-550-5M (30mm) Doble Dentado', stock: 0, threshold: 2 },
  { name: 'HTD-1270-5M (30mm)', stock: 0, threshold: 2 },
  { name: 'HTD-425-5M (30mm)', stock: 0, threshold: 2 },
  { name: 'HTD-825-5M', stock: 0, threshold: 2 },
  { name: 'HTD-670-5M', stock: 0, threshold: 2 },
  // Modulus - Piston
  { name: 'AEVU-20-4-PA', stock: 0, threshold: 2 },
  // Modulus - Rotulas
  { name: 'POS 10A (5)', stock: 0, threshold: 2 },
  { name: 'POS 10LA (5)', stock: 0, threshold: 2 },
];

/**
 * PASO 6: Función de migración automática de categorías.
 */
export async function migrateCategories(firestore: Firestore) {
  console.log("Iniciando migración de categorías...");
  const inventoryRef = collection(firestore, 'inventory');
  const snapshot = await getDocs(inventoryRef);
  
  const batch = writeBatch(firestore);
  let updatedCount = 0;

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() as InventoryItem;
    
    // Solo actualizamos si no tiene categoría definida
    if (!data.category) {
      const name = data.name.toUpperCase().trim();
      let category = "Otros";

      if (name.startsWith("60")) category = "Rodamientos 60xx";
      else if (name.startsWith("62")) category = "Rodamientos 62xx";
      else if (name.startsWith("63")) category = "Rodamientos 63xx";
      else if (name.startsWith("12") || name.startsWith("22")) category = "Rodamientos Autoalineables";
      else if (name.startsWith("30") || name.startsWith("32") || name.startsWith("33")) category = "Rodamientos Cónicos";
      else if (name.startsWith("UC")) category = "Rodamientos UC (Insertos)";
      else if (name.startsWith("NK") || name.startsWith("RNA") || name.startsWith("HK")) category = "Rodamientos de Aguja";
      else if (name.startsWith("PHS") || name.startsWith("POS")) category = "Terminales de Rótula";
      else if (name.startsWith("AEVU")) category = "Pistones";
      else if (name.startsWith("FL")) category = "Soportes";
      else if (name.startsWith("HTD")) category = "Correas";
      else if (name.startsWith("H")) category = "Manguitos de Montaje";

      batch.update(docSnap.ref, { category });
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`Migración completada. Se actualizaron ${updatedCount} artículos.`);
  } else {
    console.log("No se encontraron artículos para migrar.");
  }
}
