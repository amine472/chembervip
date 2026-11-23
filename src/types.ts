export type RoomStatus = 'libre' | 'occupee' | 'maintenance' | 'nettoyage' | 'reservee';

export type AccentPaletteId = 'blue' | 'emerald' | 'indigo' | 'slate' | 'amber';

export interface RoomTypeDefinition {
  id: string;
  code: string;
  label: string;
  capacity: number;
  description: string;
  isDefault?: boolean;
}

export interface Room {
  id: string;
  number: string;
  name: string;
  typeId: string;
  capacity: number;
  status: RoomStatus;
  notes: string;
  reservedFor?: string;
  reservedDate?: string;
  totalStaysCount: number;
  totalDaysOccupied: number;
  createdAt: string;
}

export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  company: string;
  role: string;
  phone: string;
  roomId: string | null;
  roomNumber: string;
  roomTypeLabel: string;
  entryDate: string; // YYYY-MM-DD
  expectedExitDate: string; // YYYY-MM-DD
  actualExitDate: string | null; // YYYY-MM-DD
  maxStayAlertDays?: number;
  notes: string;
  status: 'actif' | 'parti';
  createdAt: string;
}

export interface TransferRecord {
  id: string;
  residentId: string;
  residentName: string;
  fromRoomId: string;
  fromRoomNumber: string;
  toRoomId: string;
  toRoomNumber: string;
  transferDate: string; // YYYY-MM-DD
  reason: string;
  operator: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  roomId: string;
  roomNumber: string;
  issueType: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
  technician: string;
  status: 'en_cours' | 'en_attente' | 'terminee';
  notes: string;
  createdAt: string;
}

export interface CleaningRecord {
  id: string;
  roomId: string;
  roomNumber: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
  agent: string;
  status: 'a_nettoyer' | 'en_cours' | 'termine';
  notes: string;
  createdAt: string;
}

export interface EntryExitLog {
  id: string;
  residentId: string;
  residentName: string;
  roomNumber: string;
  type: 'entree' | 'sortie' | 'transfert';
  entryTimestamp: string; // ISO
  exitTimestamp: string | null; // ISO
  stayDays: number;
  operator: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO
  category:
    | 'Connexion'
    | 'Chambres'
    | 'Résidents'
    | 'Transferts'
    | 'Maintenance'
    | 'Nettoyage'
    | 'Paramètres'
    | 'Sauvegarde';
  action: string;
  details: string;
  username: string;
}

export interface AppSettings {
  appName: string;
  organizationName: string;
  organizationAddress: string;
  organizationPhone: string;
  organizationEmail: string;
  logoDataUrl: string | null;
  themeMode: 'light' | 'dark';
  accentColor: AccentPaletteId;
  departureAlertDays: number;
  maxStayAlertDays: number;
  language: 'fr';
}

export interface AuthCredentials {
  username: string;
  passwordHash: string;
  passwordSalt: string;
  mustChangePassword: boolean;
  updatedAt: string;
}

export interface DatabaseState {
  version: number;
  credentials: AuthCredentials;
  settings: AppSettings;
  roomTypes: RoomTypeDefinition[];
  rooms: Room[];
  residents: Resident[];
  transfers: TransferRecord[];
  maintenances: MaintenanceRecord[];
  cleanings: CleaningRecord[];
  entryExitLogs: EntryExitLog[];
  auditLogs: AuditLog[];
  lastSavedAt: string;
}

export type NavSection =
  | 'dashboard'
  | 'room_map'
  | 'rooms'
  | 'residents'
  | 'transfers'
  | 'maintenance'
  | 'cleaning'
  | 'entries_exits'
  | 'reports'
  | 'audit'
  | 'settings';
