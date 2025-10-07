
// Represents a single sector in the plant, managed by the user.
export type Sector = {
  id: string;
  name: string;
};

// Represents a single machine within a sector, managed by the user.
export type Machine = {
  id: string;
  name: string;
  sectorId: string;
};

// Represents a single item in the shared inventory. The 'id' is the Firestore document ID.
export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  threshold: number;
};

// Represents the usage of an item by a specific machine at a specific time.
export type UsageLog = {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  date: string; // ISO string
  sectorId: string;
  machineId: string;
};

// Represents the assignment of items to a machine.
export type MachineAssignment = {
  id:string;
  sectorId: string;
  machineId: string;
  itemId: string;
  itemName: string;
  quantity: number;
};

// Represents a user profile stored in Firestore.
export type UserProfile = {
  id: string;
  uid: string;
  email: string;
  displayName: string;
};

// Represents a user's role stored in Firestore.
export type UserRole = {
    id: string;
    role: 'admin' | 'editor';
}
