import { DatabaseState, RoomTypeDefinition } from '../types';
import { generateSalt, hashPassword } from './crypto';
import { addDaysISO, getTodayISO } from './date';

const LS_KEY = 'base_de_vie_db_v1';
const IDB_NAME = 'BaseDeViePremiumDB';
const IDB_STORE = 'appState';
const IDB_KEY = 'main';

export const DEFAULT_ROOM_TYPES: RoomTypeDefinition[] = [
  {
    id: 'type_vip',
    code: 'VIP',
    label: 'Chambre VIP',
    capacity: 1,
    description: 'Hébergement individuel de haut standing (1 personne max).',
    isDefault: true,
  },
  {
    id: 'type_cadre',
    code: 'CADRE',
    label: 'Chambre Cadre',
    capacity: 1,
    description: 'Chambre individuelle destinée aux cadres et ingénieurs (1 personne max).',
    isDefault: true,
  },
  {
    id: 'type_double',
    code: 'DOUBLE',
    label: 'Chambre Double',
    capacity: 2,
    description: 'Chambre à deux lits avec suivi indépendant par résident (2 personnes max).',
    isDefault: true,
  },
];

export function uid(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function createSeedDatabase(): Promise<DatabaseState> {
  const today = getTodayISO();
  const salt = generateSalt();
  const passwordHash = await hashPassword('0000', salt);
  const nowISO = new Date().toISOString();

  const rooms = [
    {
      id: 'rm_101',
      number: 'V-101',
      name: 'Pavillon Direction Nord',
      typeId: 'type_vip',
      capacity: 1,
      status: 'occupee' as const,
      notes: 'Climatisation révisée, accès Wi-Fi prioritaire.',
      totalStaysCount: 14,
      totalDaysOccupied: 162,
      createdAt: nowISO,
    },
    {
      id: 'rm_102',
      number: 'V-102',
      name: 'Suite Résidence Sud',
      typeId: 'type_vip',
      capacity: 1,
      status: 'libre' as const,
      notes: 'Prête pour accueil direction.',
      totalStaysCount: 9,
      totalDaysOccupied: 98,
      createdAt: nowISO,
    },
    {
      id: 'rm_103',
      number: 'V-103',
      name: 'Pavillon Oasis',
      typeId: 'type_vip',
      capacity: 1,
      status: 'reservee' as const,
      notes: 'Arrivée chef de projet prévue demain matin.',
      reservedFor: 'M. Karim BENALI (Directeur Technique)',
      reservedDate: addDaysISO(today, 1),
      totalStaysCount: 11,
      totalDaysOccupied: 120,
      createdAt: nowISO,
    },
    {
      id: 'rm_201',
      number: 'C-201',
      name: 'Bloc B - Cadre 01',
      typeId: 'type_cadre',
      capacity: 1,
      status: 'occupee' as const,
      notes: 'Standard cadre, bureau équipé.',
      totalStaysCount: 18,
      totalDaysOccupied: 215,
      createdAt: nowISO,
    },
    {
      id: 'rm_202',
      number: 'C-202',
      name: 'Bloc B - Cadre 02',
      typeId: 'type_cadre',
      capacity: 1,
      status: 'occupee' as const,
      notes: 'RAS.',
      totalStaysCount: 15,
      totalDaysOccupied: 184,
      createdAt: nowISO,
    },
    {
      id: 'rm_203',
      number: 'C-203',
      name: 'Bloc B - Cadre 03',
      typeId: 'type_cadre',
      capacity: 1,
      status: 'maintenance' as const,
      notes: 'Fuite robinetterie salle de bain signalée.',
      totalStaysCount: 12,
      totalDaysOccupied: 140,
      createdAt: nowISO,
    },
    {
      id: 'rm_204',
      number: 'C-204',
      name: 'Bloc B - Cadre 04',
      typeId: 'type_cadre',
      capacity: 1,
      status: 'nettoyage' as const,
      notes: 'Départ effectué ce matin, désinfection en cours.',
      totalStaysCount: 16,
      totalDaysOccupied: 175,
      createdAt: nowISO,
    },
    {
      id: 'rm_205',
      number: 'C-205',
      name: 'Bloc B - Cadre 05',
      typeId: 'type_cadre',
      capacity: 1,
      status: 'libre' as const,
      notes: 'Chambre contrôlée et disponible.',
      totalStaysCount: 10,
      totalDaysOccupied: 112,
      createdAt: nowISO,
    },
    {
      id: 'rm_301',
      number: 'D-301',
      name: 'Bloc C - Double 01',
      typeId: 'type_double',
      capacity: 2,
      status: 'occupee' as const,
      notes: '2 lits occupés (équipes maintenance).',
      totalStaysCount: 24,
      totalDaysOccupied: 310,
      createdAt: nowISO,
    },
    {
      id: 'rm_302',
      number: 'D-302',
      name: 'Bloc C - Double 02',
      typeId: 'type_double',
      capacity: 2,
      status: 'occupee' as const,
      notes: '1 lit occupé, 1 lit disponible.',
      totalStaysCount: 20,
      totalDaysOccupied: 245,
      createdAt: nowISO,
    },
    {
      id: 'rm_303',
      number: 'D-303',
      name: 'Bloc C - Double 03',
      typeId: 'type_double',
      capacity: 2,
      status: 'libre' as const,
      notes: '2 lits disponibles.',
      totalStaysCount: 17,
      totalDaysOccupied: 198,
      createdAt: nowISO,
    },
    {
      id: 'rm_304',
      number: 'D-304',
      name: 'Bloc C - Double 04',
      typeId: 'type_double',
      capacity: 2,
      status: 'nettoyage' as const,
      notes: 'Remise en état literie.',
      totalStaysCount: 13,
      totalDaysOccupied: 150,
      createdAt: nowISO,
    },
  ];

  const residents = [
    {
      id: 'res_1',
      firstName: 'Sofiane',
      lastName: 'MEZIANE',
      idNumber: 'MAT-4410',
      company: 'Groupe Énergie Sud',
      role: 'Directeur de Site',
      phone: '0550 12 48 90',
      roomId: 'rm_101',
      roomNumber: 'V-101',
      roomTypeLabel: 'Chambre VIP',
      entryDate: addDaysISO(today, -12),
      expectedExitDate: addDaysISO(today, 2),
      actualExitDate: null,
      maxStayAlertDays: 30,
      notes: 'Mission supervision trimestrielle.',
      status: 'actif' as const,
      createdAt: nowISO,
    },
    {
      id: 'res_2',
      firstName: 'Nabil',
      lastName: 'KHELIFI',
      idNumber: 'MAT-2891',
      company: 'Atlas Ingénierie',
      role: 'Ingénieur HSE',
      phone: '0661 84 22 15',
      roomId: 'rm_201',
      roomNumber: 'C-201',
      roomTypeLabel: 'Chambre Cadre',
      entryDate: addDaysISO(today, -28),
      expectedExitDate: addDaysISO(today, 1),
      actualExitDate: null,
      maxStayAlertDays: 30,
      notes: 'Audit sécurité chantier.',
      status: 'actif' as const,
      createdAt: nowISO,
    },
    {
      id: 'res_3',
      firstName: 'Yacine',
      lastName: 'BOUAZIZ',
      idNumber: 'MAT-3104',
      company: 'HydroTech Services',
      role: 'Chef de Quart',
      phone: '0770 39 11 04',
      roomId: 'rm_202',
      roomNumber: 'C-202',
      roomTypeLabel: 'Chambre Cadre',
      entryDate: today,
      expectedExitDate: addDaysISO(today, 14),
      actualExitDate: null,
      maxStayAlertDays: 30,
      notes: 'Arrivé ce matin (rotation 14 jours).',
      status: 'actif' as const,
      createdAt: nowISO,
    },
    {
      id: 'res_4',
      firstName: 'Rachid',
      lastName: 'MANSOURI',
      idNumber: 'MAT-1055',
      company: 'Maintenance Industrielle DZ',
      role: 'Technicien Électricien',
      phone: '0554 71 90 33',
      roomId: 'rm_301',
      roomNumber: 'D-301',
      roomTypeLabel: 'Chambre Double',
      entryDate: addDaysISO(today, -9),
      expectedExitDate: addDaysISO(today, 5),
      actualExitDate: null,
      maxStayAlertDays: 30,
      notes: 'Équipe poste de nuit.',
      status: 'actif' as const,
      createdAt: nowISO,
    },
    {
      id: 'res_5',
      firstName: 'Walid',
      lastName: 'TOUATI',
      idNumber: 'MAT-1088',
      company: 'Maintenance Industrielle DZ',
      role: 'Technicien Instrumentation',
      phone: '0558 63 20 19',
      roomId: 'rm_301',
      roomNumber: 'D-301',
      roomTypeLabel: 'Chambre Double',
      entryDate: addDaysISO(today, -4),
      expectedExitDate: addDaysISO(today, 10),
      actualExitDate: null,
      maxStayAlertDays: 30,
      notes: 'Séjour indépendant du binôme.',
      status: 'actif' as const,
      createdAt: nowISO,
    },
    {
      id: 'res_6',
      firstName: 'Farid',
      lastName: 'ZIANI',
      idNumber: 'MAT-5023',
      company: 'Génie Civil Horizon',
      role: 'Conducteur de Travaux',
      phone: '0662 47 85 10',
      roomId: 'rm_302',
      roomNumber: 'D-302',
      roomTypeLabel: 'Chambre Double',
      entryDate: addDaysISO(today, -33),
      expectedExitDate: addDaysISO(today, -1),
      actualExitDate: null,
      maxStayAlertDays: 30,
      notes: 'Prolongation exceptionnelle en attente de relève.',
      status: 'actif' as const,
      createdAt: nowISO,
    },
    {
      id: 'res_7',
      firstName: 'Mourad',
      lastName: 'HADJADJ',
      idNumber: 'MAT-2219',
      company: 'Atlas Ingénierie',
      role: 'Superviseur Logistique',
      phone: '0551 98 44 72',
      roomId: null,
      roomNumber: 'C-204',
      roomTypeLabel: 'Chambre Cadre',
      entryDate: addDaysISO(today, -15),
      expectedExitDate: today,
      actualExitDate: today,
      maxStayAlertDays: 30,
      notes: 'Fin de rotation normale.',
      status: 'parti' as const,
      createdAt: nowISO,
    },
  ];

  const maintenances = [
    {
      id: 'mnt_1',
      roomId: 'rm_203',
      roomNumber: 'C-203',
      issueType: 'Plomberie / Sanitaire',
      description: 'Remplacement mitigeur douche et vérification étanchéité siphon.',
      startDate: addDaysISO(today, -1),
      endDate: null,
      technician: 'A. Belkacem (Équipe Plomberie)',
      status: 'en_cours' as const,
      notes: 'Pièce de rechange réceptionnée.',
      createdAt: nowISO,
    },
    {
      id: 'mnt_2',
      roomId: 'rm_101',
      roomNumber: 'V-101',
      issueType: 'Climatisation / Chauffage',
      description: 'Entretien préventif filtres split.',
      startDate: addDaysISO(today, -15),
      endDate: addDaysISO(today, -14),
      technician: 'S. Rahmani',
      status: 'terminee' as const,
      notes: 'Intervention validée.',
      createdAt: nowISO,
    },
  ];

  const cleanings = [
    {
      id: 'cln_1',
      roomId: 'rm_204',
      roomNumber: 'C-204',
      startDate: today,
      endDate: null,
      agent: 'Équipe Hygiène A',
      status: 'en_cours' as const,
      notes: 'Nettoyage complet suite au départ de M. Hadjadj.',
      createdAt: nowISO,
    },
    {
      id: 'cln_2',
      roomId: 'rm_304',
      roomNumber: 'D-304',
      startDate: today,
      endDate: null,
      agent: 'Équipe Hygiène B',
      status: 'a_nettoyer' as const,
      notes: 'Renouvellement draps et contrôle sanitaire.',
      createdAt: nowISO,
    },
  ];

  const transfers = [
    {
      id: 'trf_1',
      residentId: 'res_2',
      residentName: 'Nabil KHELIFI',
      fromRoomId: 'rm_205',
      fromRoomNumber: 'C-205',
      toRoomId: 'rm_201',
      toRoomNumber: 'C-201',
      transferDate: addDaysISO(today, -10),
      reason: 'Rapprochement bureau HSE et meilleure connexion réseau.',
      operator: 'admin',
      createdAt: nowISO,
    },
  ];

  const entryExitLogs = [
    {
      id: 'eel_1',
      residentId: 'res_3',
      residentName: 'Yacine BOUAZIZ',
      roomNumber: 'C-202',
      type: 'entree' as const,
      entryTimestamp: `${today}T08:30:00`,
      exitTimestamp: null,
      stayDays: 1,
      operator: 'admin',
    },
    {
      id: 'eel_2',
      residentId: 'res_7',
      residentName: 'Mourad HADJADJ',
      roomNumber: 'C-204',
      type: 'sortie' as const,
      entryTimestamp: `${addDaysISO(today, -15)}T09:00:00`,
      exitTimestamp: `${today}T07:45:00`,
      stayDays: 16,
      operator: 'admin',
    },
    {
      id: 'eel_3',
      residentId: 'res_1',
      residentName: 'Sofiane MEZIANE',
      roomNumber: 'V-101',
      type: 'entree' as const,
      entryTimestamp: `${addDaysISO(today, -12)}T14:15:00`,
      exitTimestamp: null,
      stayDays: 13,
      operator: 'admin',
    },
  ];

  const auditLogs = [
    {
      id: 'aud_1',
      timestamp: nowISO,
      category: 'Paramètres' as const,
      action: 'Initialisation du système',
      details: 'Base de données locale initialisée avec succès.',
      username: 'Système',
    },
    {
      id: 'aud_2',
      timestamp: nowISO,
      category: 'Résidents' as const,
      action: 'Enregistrement arrivée',
      details: 'Yacine BOUAZIZ affecté à la chambre C-202.',
      username: 'admin',
    },
    {
      id: 'aud_3',
      timestamp: nowISO,
      category: 'Résidents' as const,
      action: 'Départ résident',
      details: 'Mourad HADJADJ a libéré la chambre C-204 (placée en nettoyage).',
      username: 'admin',
    },
  ];

  return {
    version: 1,
    credentials: {
      username: 'admin',
      passwordHash,
      passwordSalt: salt,
      mustChangePassword: true,
      updatedAt: nowISO,
    },
    settings: {
      appName: 'GESTION DE LA BASE DE VIE',
      organizationName: 'Base de Vie Centrale — Complexe Résidentiel',
      organizationAddress: 'Zone Industrielle Sud, Secteur Base de Vie',
      organizationPhone: '+213 (0) 29 00 00 00',
      organizationEmail: 'hebergement@basedevie.local',
      logoDataUrl: null,
      themeMode: 'light',
      accentColor: 'blue',
      departureAlertDays: 2,
      maxStayAlertDays: 30,
      language: 'fr',
    },
    roomTypes: DEFAULT_ROOM_TYPES,
    rooms,
    residents,
    transfers,
    maintenances,
    cleanings,
    entryExitLogs,
    auditLogs,
    lastSavedAt: nowISO,
  };
}

function openIDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readFromIDB(): Promise<DatabaseState | null> {
  const db = await openIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as DatabaseState) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeToIDB(state: DatabaseState): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(state, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function loadDatabase(): Promise<DatabaseState> {
  try {
    const idbData = await readFromIDB();
    if (idbData && idbData.credentials && Array.isArray(idbData.rooms)) {
      return idbData;
    }
  } catch {
    // Fallback to localStorage
  }

  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DatabaseState;
      if (parsed && parsed.credentials && Array.isArray(parsed.rooms)) {
        await writeToIDB(parsed);
        return parsed;
      }
    }
  } catch {
    // Seed fresh database
  }

  const seed = await createSeedDatabase();
  await saveDatabase(seed);
  return seed;
}

export async function saveDatabase(state: DatabaseState): Promise<void> {
  const updated: DatabaseState = {
    ...state,
    lastSavedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch {
    // Quota fallback handled by IndexedDB
  }
  await writeToIDB(updated);
}

export function downloadFile(filename: string, content: string | Blob, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportBackupJSON(db: DatabaseState): void {
  const dateTag = getTodayISO();
  const payload = JSON.stringify(db, null, 2);
  downloadFile(`sauvegarde_base_de_vie_${dateTag}.json`, payload, 'application/json;charset=utf-8');
}

export function validateBackupJSON(jsonText: string): DatabaseState {
  const parsed = JSON.parse(jsonText) as Partial<DatabaseState>;
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !parsed.credentials ||
    !parsed.credentials.username ||
    !parsed.credentials.passwordHash ||
    !parsed.settings ||
    !Array.isArray(parsed.rooms) ||
    !Array.isArray(parsed.residents) ||
    !Array.isArray(parsed.roomTypes)
  ) {
    throw new Error('Structure de sauvegarde invalide ou incomplète.');
  }
  return {
    version: parsed.version || 1,
    credentials: parsed.credentials,
    settings: parsed.settings,
    roomTypes: parsed.roomTypes,
    rooms: parsed.rooms,
    residents: parsed.residents,
    transfers: Array.isArray(parsed.transfers) ? parsed.transfers : [],
    maintenances: Array.isArray(parsed.maintenances) ? parsed.maintenances : [],
    cleanings: Array.isArray(parsed.cleanings) ? parsed.cleanings : [],
    entryExitLogs: Array.isArray(parsed.entryExitLogs) ? parsed.entryExitLogs : [],
    auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
    lastSavedAt: new Date().toISOString(),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportToExcelXLS(
  filename: string,
  reportTitle: string,
  orgName: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const headerHtml = headers
    .map(
      (h) =>
        `<th style="background:#1e293b;color:#ffffff;padding:8px 12px;border:1px solid #cbd5e1;text-align:left;font-family:Arial,sans-serif;font-size:12px;">${escapeHtml(h)}</th>`
    )
    .join('');

  const rowsHtml = rows
    .map(
      (row, idx) =>
        `<tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${row
          .map(
            (cell) =>
              `<td style="padding:7px 12px;border:1px solid #e2e8f0;font-family:Arial,sans-serif;font-size:12px;">${escapeHtml(String(cell ?? ''))}</td>`
          )
          .join('')}</tr>`
    )
    .join('');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8" /></head>
<body>
  <h2 style="font-family:Arial,sans-serif;color:#0f172a;margin-bottom:4px;">${escapeHtml(orgName)}</h2>
  <h3 style="font-family:Arial,sans-serif;color:#334155;margin-top:0;">${escapeHtml(reportTitle)}</h3>
  <p style="font-family:Arial,sans-serif;color:#64748b;font-size:11px;">Édité le ${new Date().toLocaleString('fr-FR')} — Conçu / Designed by ABDELHAKEM Lamine</p>
  <table style="border-collapse:collapse;width:100%;">
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;

  downloadFile(
    filename.endsWith('.xls') ? filename : `${filename}.xls`,
    '\uFEFF' + html,
    'application/vnd.ms-excel;charset=utf-8'
  );
}

export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '');
    if (s.includes(';') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.map(escapeCsv).join(';'),
    ...rows.map((r) => r.map(escapeCsv).join(';')),
  ];
  downloadFile(
    filename.endsWith('.csv') ? filename : `${filename}.csv`,
    '\uFEFF' + lines.join('\r\n'),
    'text/csv;charset=utf-8'
  );
}
