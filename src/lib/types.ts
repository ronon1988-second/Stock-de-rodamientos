

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

// Represents a dictionary of machines keyed by their sector ID.
export type MachinesBySector = {
  [sectorId: string]: Machine[];
};

export type ItemCategory = 'rodamientos' | 'pistones' | 'lonas' | 'correas' | 'otros';

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
  sectorId: string; // Can be 'general' for non-specific usage
  machineId: string; // Can be 'general' for non-specific usage
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
  id: string; // The doc id, which is the user's UID
  uid: string;
  email: string;
  displayName: string;
};

// Represents a user's role stored in Firestore.
export type UserRole = {
    id: string; // The id of this doc is the user's UID
    role: 'admin' | 'editor' | 'user';
}

    