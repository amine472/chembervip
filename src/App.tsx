import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  BarChart3,
  BedDouble,
  ClipboardList,
  Grid2x2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { AuditLogView } from './components/AuditLogView';
import { CleaningView } from './components/CleaningView';
import { DashboardView } from './components/DashboardView';
import { AppLogo } from './components/DefaultLogo';
import { EntriesExitsView } from './components/EntriesExitsView';
import { LoginView } from './components/LoginView';
import { MaintenanceView } from './components/MaintenanceView';
import { ReportsView } from './components/ReportsView';
import { ResidentCardModal } from './components/ResidentCardModal';
import { ResidentsView } from './components/ResidentsView';
import { RoomDetailModal } from './components/RoomDetailModal';
import { RoomMapView } from './components/RoomMapView';
import { RoomsView } from './components/RoomsView';
import { SettingsView } from './components/SettingsView';
import { TransfersView } from './components/TransfersView';
import {
  AppSettings,
  AuditLog,
  CleaningRecord,
  DatabaseState,
  MaintenanceRecord,
  NavSection,
  Resident,
  Room,
  RoomStatus,
  RoomTypeDefinition,
} from './types';
import { generateSalt, hashPassword, verifyPassword } from './utils/crypto';
import {
  calculateStayDays,
  formatClockFR,
  formatFullDateFR,
  getTodayISO,
} from './utils/date';
import { ACCENT_PALETTES } from './utils/i18n';
import {
  createSeedDatabase,
  loadDatabase,
  saveDatabase,
  uid,
} from './utils/storage';

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'room_map', label: 'Plan des chambres', icon: Grid2x2 },
  { id: 'rooms', label: 'Chambres', icon: BedDouble },
  { id: 'residents', label: 'Résidents', icon: Users },
  { id: 'transfers', label: 'Transferts', icon: ArrowRightLeft },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'cleaning', label: 'Nettoyage', icon: Sparkles },
  { id: 'entries_exits', label: 'Entrées / Sorties', icon: ClipboardList },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
  { id: 'audit', label: 'Journal', icon: History },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export default function App() {
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  // Cross-view contextual states
  const [selectedRoomModal, setSelectedRoomModal] = useState<Room | null>(null);
  const [printingResident, setPrintingResident] = useState<Resident | null>(null);
  const [preselectedRoomForResident, setPreselectedRoomForResident] = useState<Room | null>(null);
  const [preselectedResidentForTransfer, setPreselectedResidentForTransfer] = useState<Resident | null>(null);
  const [preselectedRoomForMaintenance, setPreselectedRoomForMaintenance] = useState<Room | null>(null);
  const [preselectedRoomForCleaning, setPreselectedRoomForCleaning] = useState<Room | null>(null);

  // Reserve room quick modal
  const [reserveModalRoom, setReserveModalRoom] = useState<Room | null>(null);
  const [reserveName, setReserveName] = useState('');
  const [reserveDate, setReserveDate] = useState(getTodayISO());

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showToast = useCallback((text: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }, []);

  // Load persistent local database
  useEffect(() => {
    loadDatabase().then((loaded) => {
      setDb(loaded);
    });
  }, []);

  // Live digital clock (updates every second)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Disable right-click context menu globally as requested
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', blockContextMenu);
    return () => document.removeEventListener('contextmenu', blockContextMenu);
  }, []);

  // Sync light/dark theme class & document title
  useEffect(() => {
    if (!db) return;
    const root = document.documentElement;
    if (db.settings.themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const palette = ACCENT_PALETTES[db.settings.accentColor] || ACCENT_PALETTES.blue;
    root.style.setProperty('--accent-color', palette.primary);
    document.title = db.settings.appName;
  }, [db]);

  // Helper to commit DB changes with audit log + auto-save
  const commitDb = useCallback(
    (
      updater: (prev: DatabaseState) => DatabaseState,
      audit?: { category: AuditLog['category']; action: string; details: string }
    ) => {
      setDb((prev) => {
        if (!prev) return prev;
        let next = updater(prev);
        if (audit) {
          const entry: AuditLog = {
            id: uid('aud'),
            timestamp: new Date().toISOString(),
            category: audit.category,
            action: audit.action,
            details: audit.details,
            username: next.credentials.username,
          };
          next = {
            ...next,
            auditLogs: [entry, ...next.auditLogs],
          };
        }
        next = {
          ...next,
          lastSavedAt: new Date().toISOString(),
        };
        void saveDatabase(next);
        return next;
      });
    },
    []
  );

  // Auth handlers
  const handleLogin = async (username: string, password: string) => {
    if (!db) return { ok: false, error: 'Base de données en cours de chargement.' };
    if (username.trim().toLowerCase() !== db.credentials.username.toLowerCase()) {
      return { ok: false, error: "Nom d'utilisateur ou mot de passe incorrect." };
    }
    const valid = await verifyPassword(
      password,
      db.credentials.passwordSalt,
      db.credentials.passwordHash
    );
    if (!valid) {
      return { ok: false, error: "Nom d'utilisateur ou mot de passe incorrect." };
    }
    if (db.credentials.mustChangePassword) {
      return { ok: true, mustChange: true };
    }
    setIsAuthenticated(true);
    commitDb((prev) => prev, {
      category: 'Connexion',
      action: 'Connexion réussie',
      details: `Ouverture de session par ${db.credentials.username}.`,
    });
    return { ok: true, mustChange: false };
  };

  const handleForcePasswordChange = async (newUsername: string, newPassword: string) => {
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);
    commitDb(
      (prev) => ({
        ...prev,
        credentials: {
          username: newUsername,
          passwordHash: newHash,
          passwordSalt: newSalt,
          mustChangePassword: false,
          updatedAt: new Date().toISOString(),
        },
      }),
      {
        category: 'Connexion',
        action: 'Sécurisation initiale du compte',
        details: `Mot de passe par défaut modifié pour l'utilisateur "${newUsername}".`,
      }
    );
    setIsAuthenticated(true);
    showToast('Mot de passe modifié et chiffré avec succès.');
  };

  const handleLogout = () => {
    commitDb((prev) => prev, {
      category: 'Connexion',
      action: 'Déconnexion',
      details: `Fermeture de session par ${db?.credentials.username || 'admin'}.`,
    });
    setIsAuthenticated(false);
    setSelectedRoomModal(null);
    setPrintingResident(null);
    setActiveSection('dashboard');
  };

  const handleToggleTheme = () => {
    if (!db) return;
    const nextMode = db.settings.themeMode === 'dark' ? 'light' : 'dark';
    commitDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, themeMode: nextMode },
    }));
  };

  // Room CRUD
  const handleSaveRoom = (
    roomData: Omit<Room, 'id' | 'totalStaysCount' | 'totalDaysOccupied' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      commitDb(
        (prev) => ({
          ...prev,
          rooms: prev.rooms.map((rm) =>
            rm.id === existingId ? { ...rm, ...roomData } : rm
          ),
          residents: prev.residents.map((res) =>
            res.roomId === existingId
              ? {
                  ...res,
                  roomNumber: roomData.number,
                  roomTypeLabel:
                    prev.roomTypes.find((t) => t.id === roomData.typeId)?.label ||
                    res.roomTypeLabel,
                }
              : res
          ),
        }),
        {
          category: 'Chambres',
          action: 'Modification chambre',
          details: `Chambre ${roomData.number} mise à jour (statut : ${roomData.status}).`,
        }
      );
      showToast(`Chambre ${roomData.number} mise à jour.`);
    } else {
      const newRoom: Room = {
        ...roomData,
        id: uid('rm'),
        totalStaysCount: 0,
        totalDaysOccupied: 0,
        createdAt: new Date().toISOString(),
      };
      commitDb(
        (prev) => ({
          ...prev,
          rooms: [...prev.rooms, newRoom],
        }),
        {
          category: 'Chambres',
          action: 'Ajout chambre',
          details: `Nouvelle chambre ${newRoom.number} (${newRoom.capacity} lit(s)) créée.`,
        }
      );
      showToast(`Chambre ${newRoom.number} ajoutée.`);
    }
  };

  const handleDeleteRoom = (room: Room) => {
    if (!db) return;
    const hasActive = db.residents.some((r) => r.status === 'actif' && r.roomId === room.id);
    if (hasActive) {
      showToast('Impossible de supprimer une chambre occupée.', 'err');
      return;
    }
    commitDb(
      (prev) => ({
        ...prev,
        rooms: prev.rooms.filter((r) => r.id !== room.id),
      }),
      {
        category: 'Chambres',
        action: 'Suppression chambre',
        details: `Chambre ${room.number} supprimée du parc.`,
      }
    );
    showToast(`Chambre ${room.number} supprimée.`);
  };

  const handleAddRoomType = (typeData: Omit<RoomTypeDefinition, 'id' | 'isDefault'>) => {
    const newType: RoomTypeDefinition = {
      ...typeData,
      id: uid('type'),
      isDefault: false,
    };
    commitDb(
      (prev) => ({
        ...prev,
        roomTypes: [...prev.roomTypes, newType],
      }),
      {
        category: 'Chambres',
        action: 'Nouveau type de chambre',
        details: `Type "${newType.label}" (${newType.capacity} lit(s)) ajouté.`,
      }
    );
    showToast(`Type "${newType.label}" ajouté.`);
  };

  // Resident save (new admission, edit, or reactivation of former resident)
  const handleSaveResident = (
    data: {
      firstName: string;
      lastName: string;
      idNumber: string;
      company: string;
      role: string;
      phone: string;
      roomId: string;
      entryDate: string;
      expectedExitDate: string;
      maxStayAlertDays: number;
      notes: string;
    },
    existingId?: string
  ) => {
    if (!db) return;
    const targetRoom = db.rooms.find((r) => r.id === data.roomId);
    if (!targetRoom) return;
    const roomTypeLabel =
      db.roomTypes.find((rt) => rt.id === targetRoom.typeId)?.label || targetRoom.typeId;

    const existingRes = existingId ? db.residents.find((r) => r.id === existingId) : null;
    const isNewStay = !existingRes || existingRes.status === 'parti';

    commitDb(
      (prev) => {
        let updatedResidents: Resident[];
        const resId = existingRes ? existingRes.id : uid('res');

        if (existingRes) {
          updatedResidents = prev.residents.map((r) =>
            r.id === existingRes.id
              ? {
                  ...r,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  idNumber: data.idNumber,
                  company: data.company,
                  role: data.role,
                  phone: data.phone,
                  roomId: targetRoom.id,
                  roomNumber: targetRoom.number,
                  roomTypeLabel,
                  entryDate: data.entryDate,
                  expectedExitDate: data.expectedExitDate,
                  actualExitDate: null,
                  maxStayAlertDays: data.maxStayAlertDays,
                  notes: data.notes,
                  status: 'actif',
                }
              : r
          );
        } else {
          const newResident: Resident = {
            id: resId,
            firstName: data.firstName,
            lastName: data.lastName,
            idNumber: data.idNumber,
            company: data.company,
            role: data.role,
            phone: data.phone,
            roomId: targetRoom.id,
            roomNumber: targetRoom.number,
            roomTypeLabel,
            entryDate: data.entryDate,
            expectedExitDate: data.expectedExitDate,
            actualExitDate: null,
            maxStayAlertDays: data.maxStayAlertDays,
            notes: data.notes,
            status: 'actif',
            createdAt: new Date().toISOString(),
          };
          updatedResidents = [newResident, ...prev.residents];
        }

        // Update rooms status (if editing and room changed, free previous room if empty)
        const updatedRooms = prev.rooms.map((rm) => {
          if (rm.id === targetRoom.id) {
            return {
              ...rm,
              status: 'occupee' as const,
              reservedFor: undefined,
              reservedDate: undefined,
              totalStaysCount: isNewStay ? rm.totalStaysCount + 1 : rm.totalStaysCount,
            };
          }
          if (existingRes && existingRes.roomId === rm.id && rm.id !== targetRoom.id) {
            const stillOccupied = updatedResidents.some(
              (r) => r.status === 'actif' && r.roomId === rm.id
            );
            return {
              ...rm,
              status: stillOccupied ? ('occupee' as const) : ('libre' as const),
            };
          }
          return rm;
        });

        const updatedLogs = isNewStay
          ? [
              {
                id: uid('eel'),
                residentId: resId,
                residentName: `${data.firstName} ${data.lastName}`,
                roomNumber: targetRoom.number,
                type: 'entree' as const,
                entryTimestamp: new Date().toISOString(),
                exitTimestamp: null,
                stayDays: calculateStayDays(data.entryDate),
                operator: prev.credentials.username,
              },
              ...prev.entryExitLogs,
            ]
          : prev.entryExitLogs;

        return {
          ...prev,
          residents: updatedResidents,
          rooms: updatedRooms,
          entryExitLogs: updatedLogs,
        };
      },
      {
        category: 'Résidents',
        action: isNewStay ? 'Enregistrement résident' : 'Modification résident',
        details: `${data.firstName} ${data.lastName} — Chambre ${targetRoom.number}.`,
      }
    );

    showToast(
      isNewStay
        ? `${data.firstName} ${data.lastName} affecté(e) à la chambre ${targetRoom.number}.`
        : `Dossier de ${data.firstName} ${data.lastName} mis à jour.`
    );
  };

  // Resident Check-out
  const handleCheckoutResident = (
    resident: Resident,
    postRoomStatus: RoomStatus,
    exitDate: string
  ) => {
    const stayDays = calculateStayDays(resident.entryDate, exitDate);
    const oldRoomId = resident.roomId;

    commitDb(
      (prev) => {
        const updatedResidents = prev.residents.map((r) =>
          r.id === resident.id
            ? {
                ...r,
                status: 'parti' as const,
                actualExitDate: exitDate,
                roomId: null,
              }
            : r
        );

        const stillOccupied = oldRoomId
          ? updatedResidents.some((r) => r.status === 'actif' && r.roomId === oldRoomId)
          : false;

        const updatedRooms = prev.rooms.map((rm) => {
          if (rm.id === oldRoomId) {
            return {
              ...rm,
              status: stillOccupied ? ('occupee' as const) : postRoomStatus,
              totalDaysOccupied: rm.totalDaysOccupied + stayDays,
            };
          }
          return rm;
        });

        let updatedCleanings = prev.cleanings;
        if (!stillOccupied && postRoomStatus === 'nettoyage' && oldRoomId) {
          const cln: CleaningRecord = {
            id: uid('cln'),
            roomId: oldRoomId,
            roomNumber: resident.roomNumber,
            startDate: exitDate,
            endDate: null,
            agent: 'À affecter',
            status: 'a_nettoyer',
            notes: `Nettoyage suite au départ de ${resident.firstName} ${resident.lastName}.`,
            createdAt: new Date().toISOString(),
          };
          updatedCleanings = [cln, ...prev.cleanings];
        }

        const exitLog = {
          id: uid('eel'),
          residentId: resident.id,
          residentName: `${resident.firstName} ${resident.lastName}`,
          roomNumber: resident.roomNumber,
          type: 'sortie' as const,
          entryTimestamp: `${resident.entryDate}T08:00:00`,
          exitTimestamp: new Date().toISOString(),
          stayDays,
          operator: prev.credentials.username,
        };

        return {
          ...prev,
          residents: updatedResidents,
          rooms: updatedRooms,
          cleanings: updatedCleanings,
          entryExitLogs: [exitLog, ...prev.entryExitLogs],
        };
      },
      {
        category: 'Résidents',
        action: 'Départ résident',
        details: `${resident.firstName} ${resident.lastName} a libéré la chambre ${resident.roomNumber} (${stayDays} j).`,
      }
    );

    setSelectedRoomModal(null);
    showToast(`Départ enregistré pour ${resident.firstName} ${resident.lastName} (${stayDays} j).`);
  };

  // Transfer Resident between rooms
  const handleExecuteTransfer = (
    residentId: string,
    toRoomId: string,
    transferDate: string,
    reason: string
  ) => {
    if (!db) return;
    const resident = db.residents.find((r) => r.id === residentId);
    const targetRoom = db.rooms.find((r) => r.id === toRoomId);
    if (!resident || !targetRoom) return;

    const fromRoomId = resident.roomId || '';
    const fromRoomNumber = resident.roomNumber;
    const targetTypeLabel =
      db.roomTypes.find((t) => t.id === targetRoom.typeId)?.label || targetRoom.typeId;

    commitDb(
      (prev) => {
        const updatedResidents = prev.residents.map((r) =>
          r.id === resident.id
            ? {
                ...r,
                roomId: targetRoom.id,
                roomNumber: targetRoom.number,
                roomTypeLabel: targetTypeLabel,
              }
            : r
        );

        const fromStillOccupied = updatedResidents.some(
          (r) => r.status === 'actif' && r.roomId === fromRoomId
        );

        const updatedRooms = prev.rooms.map((rm) => {
          if (rm.id === fromRoomId) {
            return {
              ...rm,
              status: fromStillOccupied ? ('occupee' as const) : ('libre' as const),
            };
          }
          if (rm.id === targetRoom.id) {
            return {
              ...rm,
              status: 'occupee' as const,
              reservedFor: undefined,
              reservedDate: undefined,
              totalStaysCount: rm.totalStaysCount + 1,
            };
          }
          return rm;
        });

        const transferRecord = {
          id: uid('trf'),
          residentId: resident.id,
          residentName: `${resident.firstName} ${resident.lastName}`,
          fromRoomId,
          fromRoomNumber,
          toRoomId: targetRoom.id,
          toRoomNumber: targetRoom.number,
          transferDate,
          reason,
          operator: prev.credentials.username,
          createdAt: new Date().toISOString(),
        };

        const movementLog = {
          id: uid('eel'),
          residentId: resident.id,
          residentName: `${resident.firstName} ${resident.lastName}`,
          roomNumber: `${fromRoomNumber} → ${targetRoom.number}`,
          type: 'transfert' as const,
          entryTimestamp: new Date().toISOString(),
          exitTimestamp: null,
          stayDays: calculateStayDays(resident.entryDate),
          operator: prev.credentials.username,
        };

        return {
          ...prev,
          residents: updatedResidents,
          rooms: updatedRooms,
          transfers: [transferRecord, ...prev.transfers],
          entryExitLogs: [movementLog, ...prev.entryExitLogs],
        };
      },
      {
        category: 'Transferts',
        action: 'Transfert de chambre',
        details: `${resident.firstName} ${resident.lastName} transféré(e) de ${fromRoomNumber} vers ${targetRoom.number}. Motif : ${reason}`,
      }
    );

    showToast(`Transfert effectué vers la chambre ${targetRoom.number}.`);
  };

  // Maintenance
  const handleAddMaintenance = (data: {
    roomId: string;
    issueType: string;
    description: string;
    startDate: string;
    technician: string;
    notes: string;
  }) => {
    if (!db) return;
    const room = db.rooms.find((r) => r.id === data.roomId);
    if (!room) return;

    const record: MaintenanceRecord = {
      id: uid('mnt'),
      roomId: room.id,
      roomNumber: room.number,
      issueType: data.issueType,
      description: data.description,
      startDate: data.startDate,
      endDate: null,
      technician: data.technician,
      status: 'en_cours',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    commitDb(
      (prev) => ({
        ...prev,
        maintenances: [record, ...prev.maintenances],
        rooms: prev.rooms.map((rm) =>
          rm.id === room.id
            ? { ...rm, status: 'maintenance', notes: `${data.issueType} : ${data.description}` }
            : rm
        ),
      }),
      {
        category: 'Maintenance',
        action: 'Mise en maintenance',
        details: `Chambre ${room.number} placée en maintenance (${data.issueType}).`,
      }
    );
    showToast(`Chambre ${room.number} placée en maintenance.`);
  };

  const handleCompleteMaintenance = (record: MaintenanceRecord, freeRoom: boolean) => {
    const today = getTodayISO();
    commitDb(
      (prev) => ({
        ...prev,
        maintenances: prev.maintenances.map((m) =>
          m.id === record.id ? { ...m, status: 'terminee', endDate: today } : m
        ),
        rooms: prev.rooms.map((rm) =>
          rm.id === record.roomId
            ? { ...rm, status: freeRoom ? 'libre' : rm.status }
            : rm
        ),
      }),
      {
        category: 'Maintenance',
        action: 'Fin de maintenance',
        details: `Réparation terminée sur la chambre ${record.roomNumber}. Chambre rendue libre.`,
      }
    );
    showToast(`Maintenance terminée : chambre ${record.roomNumber} libre.`);
  };

  // Cleaning
  const handleAddCleaning = (data: {
    roomId: string;
    startDate: string;
    agent: string;
    notes: string;
  }) => {
    if (!db) return;
    const room = db.rooms.find((r) => r.id === data.roomId);
    if (!room) return;

    const record: CleaningRecord = {
      id: uid('cln'),
      roomId: room.id,
      roomNumber: room.number,
      startDate: data.startDate,
      endDate: null,
      agent: data.agent,
      status: 'en_cours',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    commitDb(
      (prev) => ({
        ...prev,
        cleanings: [record, ...prev.cleanings],
        rooms: prev.rooms.map((rm) =>
          rm.id === room.id ? { ...rm, status: 'nettoyage' } : rm
        ),
      }),
      {
        category: 'Nettoyage',
        action: 'Nettoyage planifié',
        details: `Chambre ${room.number} placée en nettoyage (Agent : ${data.agent}).`,
      }
    );
    showToast(`Chambre ${room.number} placée en nettoyage.`);
  };

  const handleCompleteCleaning = (record: CleaningRecord) => {
    const today = getTodayISO();
    commitDb(
      (prev) => ({
        ...prev,
        cleanings: prev.cleanings.map((c) =>
          c.id === record.id ? { ...c, status: 'termine', endDate: today } : c
        ),
        rooms: prev.rooms.map((rm) =>
          rm.id === record.roomId ? { ...rm, status: 'libre' } : rm
        ),
      }),
      {
        category: 'Nettoyage',
        action: 'Nettoyage terminé',
        details: `Nettoyage validé pour la chambre ${record.roomNumber}. Chambre disponible.`,
      }
    );
    showToast(`Chambre ${record.roomNumber} nettoyée et disponible.`);
  };

  const handleMarkRoomFree = (room: Room) => {
    const today = getTodayISO();
    commitDb(
      (prev) => ({
        ...prev,
        rooms: prev.rooms.map((rm) =>
          rm.id === room.id
            ? { ...rm, status: 'libre', reservedFor: undefined, reservedDate: undefined }
            : rm
        ),
        maintenances: prev.maintenances.map((m) =>
          m.roomId === room.id && m.status !== 'terminee'
            ? { ...m, status: 'terminee', endDate: today }
            : m
        ),
        cleanings: prev.cleanings.map((c) =>
          c.roomId === room.id && c.status !== 'termine'
            ? { ...c, status: 'termine', endDate: today }
            : c
        ),
      }),
      {
        category: 'Chambres',
        action: 'Chambre libérée',
        details: `Chambre ${room.number} passée au statut Libre.`,
      }
    );
    setSelectedRoomModal(null);
    showToast(`Chambre ${room.number} marquée comme Libre.`);
  };

  const handleConfirmReserveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveModalRoom || !reserveName.trim()) return;
    commitDb(
      (prev) => ({
        ...prev,
        rooms: prev.rooms.map((rm) =>
          rm.id === reserveModalRoom.id
            ? {
                ...rm,
                status: 'reservee',
                reservedFor: reserveName.trim(),
                reservedDate: reserveDate,
              }
            : rm
        ),
      }),
      {
        category: 'Chambres',
        action: 'Réservation chambre',
        details: `Chambre ${reserveModalRoom.number} réservée pour ${reserveName.trim()}.`,
      }
    );
    showToast(`Chambre ${reserveModalRoom.number} réservée.`);
    setReserveModalRoom(null);
    setReserveName('');
  };

  // Settings & Security updates
  const handleUpdateSettings = (nextSettings: AppSettings) => {
    commitDb(
      (prev) => ({ ...prev, settings: nextSettings }),
      {
        category: 'Paramètres',
        action: 'Mise à jour des paramètres',
        details: `Configuration mise à jour (${nextSettings.appName}).`,
      }
    );
    showToast('Paramètres enregistrés.');
  };

  const handleUpdateCredentials = async (
    currentPwd: string,
    newUsername: string,
    newPwd: string
  ) => {
    if (!db) return { ok: false, error: 'Base indisponible.' };
    const valid = await verifyPassword(
      currentPwd,
      db.credentials.passwordSalt,
      db.credentials.passwordHash
    );
    if (!valid) {
      return { ok: false, error: 'Le mot de passe actuel est incorrect.' };
    }
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPwd, newSalt);
    commitDb(
      (prev) => ({
        ...prev,
        credentials: {
          username: newUsername,
          passwordHash: newHash,
          passwordSalt: newSalt,
          mustChangePassword: false,
          updatedAt: new Date().toISOString(),
        },
      }),
      {
        category: 'Paramètres',
        action: 'Modification identifiants',
        details: `Identifiants mis à jour pour "${newUsername}".`,
      }
    );
    showToast('Identifiants mis à jour.');
    return { ok: true };
  };

  const handleRestoreBackup = (restored: DatabaseState) => {
    commitDb(() => restored, {
      category: 'Sauvegarde',
      action: 'Restauration sauvegarde',
      details: `Base restaurée depuis un fichier JSON (${restored.rooms.length} chambres, ${restored.residents.length} résidents).`,
    });
    showToast('Sauvegarde restaurée avec succès.');
  };

  const handleResetSeed = async () => {
    const fresh = await createSeedDatabase();
    if (db) {
      fresh.credentials = db.credentials;
    }
    await saveDatabase(fresh);
    setDb(fresh);
    showToast('Données initiales restaurées.');
  };

  // Loading state
  if (!db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-sm">
        Chargement de la base de données locale...
      </div>
    );
  }

  // Strict Auth Gate (never bypassable)
  if (!isAuthenticated) {
    return (
      <LoginView
        now={now}
        settings={db.settings}
        credentials={db.credentials}
        onLogin={handleLogin}
        onForcePasswordChange={handleForcePasswordChange}
        onUploadLogo={(logoDataUrl) =>
          commitDb((prev) => ({
            ...prev,
            settings: { ...prev.settings, logoDataUrl },
          }))
        }
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  const accent = ACCENT_PALETTES[db.settings.accentColor] || ACCENT_PALETTES.blue;
  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeSection) || NAV_ITEMS[0];

  // Keep selected room modal synced with latest room data
  const syncedModalRoom = selectedRoomModal
    ? db.rooms.find((r) => r.id === selectedRoomModal.id) || null
    : null;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <AppLogo logoDataUrl={db.settings.logoDataUrl} size="sm" />
          <div className="min-w-0">
            <div className="font-display font-bold text-xs uppercase tracking-tight text-slate-900 dark:text-white truncate">
              {db.settings.appName}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {db.settings.organizationName}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? `${accent.bgClass} text-white`
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <div>Conçu / Designed by</div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            ABDELHAKEM Lamine
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full flex flex-col border-r border-slate-200 dark:border-slate-800 z-10">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <AppLogo logoDataUrl={db.settings.logoDataUrl} size="sm" />
                <span className="font-display font-bold text-xs uppercase truncate">
                  {db.settings.appName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      active
                        ? `${accent.bgClass} text-white`
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (3-zone clean contract) */}
        <header className="no-print sticky top-0 z-30 h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400">Base de Vie</span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
              <span className="font-display font-bold text-slate-900 dark:text-white truncate">
                {activeNavMeta.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Live Date & Digital Clock with Seconds */}
            <div className="hidden md:flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="whitespace-nowrap">{formatFullDateFR(now)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                {formatClockFR(now)}
              </span>
            </div>

            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Connected user + controls */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {db.credentials.username}
              </span>
              <button
                type="button"
                onClick={handleToggleTheme}
                aria-label="Basculer mode jour / nuit"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {db.settings.themeMode === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeSection === 'dashboard' && (
            <DashboardView
              db={db}
              onNavigate={setActiveSection}
              onSelectRoom={(rm) => setSelectedRoomModal(rm)}
            />
          )}
          {activeSection === 'room_map' && (
            <RoomMapView db={db} onSelectRoom={(rm) => setSelectedRoomModal(rm)} />
          )}
          {activeSection === 'rooms' && (
            <RoomsView
              db={db}
              onSaveRoom={handleSaveRoom}
              onDeleteRoom={handleDeleteRoom}
              onAddRoomType={handleAddRoomType}
              onSelectRoom={(rm) => setSelectedRoomModal(rm)}
            />
          )}
          {activeSection === 'residents' && (
            <ResidentsView
              db={db}
              preselectedRoomForAdd={preselectedRoomForResident}
              onClearPreselectedRoom={() => setPreselectedRoomForResident(null)}
              onSaveResident={handleSaveResident}
              onCheckoutResident={handleCheckoutResident}
              onOpenTransferForResident={(res) => {
                setPreselectedResidentForTransfer(res);
                setActiveSection('transfers');
              }}
              onPrintResidentCard={(res) => setPrintingResident(res)}
            />
          )}
          {activeSection === 'transfers' && (
            <TransfersView
              db={db}
              preselectedResident={preselectedResidentForTransfer}
              onClearPreselected={() => setPreselectedResidentForTransfer(null)}
              onExecuteTransfer={handleExecuteTransfer}
            />
          )}
          {activeSection === 'maintenance' && (
            <MaintenanceView
              db={db}
              preselectedRoom={preselectedRoomForMaintenance}
              onClearPreselectedRoom={() => setPreselectedRoomForMaintenance(null)}
              onAddMaintenance={handleAddMaintenance}
              onCompleteMaintenance={handleCompleteMaintenance}
            />
          )}
          {activeSection === 'cleaning' && (
            <CleaningView
              db={db}
              preselectedRoom={preselectedRoomForCleaning}
              onClearPreselectedRoom={() => setPreselectedRoomForCleaning(null)}
              onAddCleaning={handleAddCleaning}
              onCompleteCleaning={handleCompleteCleaning}
            />
          )}
          {activeSection === 'entries_exits' && <EntriesExitsView db={db} />}
          {activeSection === 'reports' && <ReportsView db={db} />}
          {activeSection === 'audit' && <AuditLogView db={db} />}
          {activeSection === 'settings' && (
            <SettingsView
              db={db}
              onUpdateSettings={handleUpdateSettings}
              onUpdateCredentials={handleUpdateCredentials}
              onRestoreBackup={handleRestoreBackup}
              onResetSeed={handleResetSeed}
            />
          )}
        </main>

        {/* Required Bottom Footer */}
        <footer className="no-print px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{db.settings.organizationName}</span>
          <span>
            Conçu / Designed by{' '}
            <strong className="text-slate-800 dark:text-slate-200">ABDELHAKEM Lamine</strong>
          </span>
        </footer>
      </div>

      {/* Room Detail Inspector Modal */}
      {syncedModalRoom && (
        <RoomDetailModal
          room={syncedModalRoom}
          roomType={db.roomTypes.find((rt) => rt.id === syncedModalRoom.typeId)}
          occupants={db.residents.filter(
            (r) => r.status === 'actif' && r.roomId === syncedModalRoom.id
          )}
          maxStayAlertDays={db.settings.maxStayAlertDays}
          onClose={() => setSelectedRoomModal(null)}
          onAddResidentToRoom={(rm) => {
            setSelectedRoomModal(null);
            setPreselectedRoomForResident(rm);
            setActiveSection('residents');
          }}
          onCheckoutResident={(res) => {
            handleCheckoutResident(res, 'nettoyage', getTodayISO());
          }}
          onTransferResident={(res) => {
            setSelectedRoomModal(null);
            setPreselectedResidentForTransfer(res);
            setActiveSection('transfers');
          }}
          onSendToMaintenance={(rm) => {
            setSelectedRoomModal(null);
            setPreselectedRoomForMaintenance(rm);
            setActiveSection('maintenance');
          }}
          onSendToCleaning={(rm) => {
            setSelectedRoomModal(null);
            setPreselectedRoomForCleaning(rm);
            setActiveSection('cleaning');
          }}
          onMarkRoomFree={handleMarkRoomFree}
          onReserveRoom={(rm) => {
            setSelectedRoomModal(null);
            setReserveModalRoom(rm);
            setReserveName('');
            setReserveDate(getTodayISO());
          }}
          onEditRoom={() => {
            setSelectedRoomModal(null);
            setActiveSection('rooms');
          }}
          onPrintResidentCard={(res) => {
            setSelectedRoomModal(null);
            setPrintingResident(res);
          }}
        />
      )}

      {/* Reserve Room Quick Modal */}
      {reserveModalRoom && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Réserver la chambre {reserveModalRoom.number}
            </h3>
            <form onSubmit={handleConfirmReserveRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Réservée pour (Nom et Prénom) *
                </label>
                <input
                  type="text"
                  value={reserveName}
                  onChange={(e) => setReserveName(e.target.value)}
                  required
                  placeholder="Ex: M. Karim BENALI"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Date d’arrivée prévue</label>
                <input
                  type="date"
                  value={reserveDate}
                  onChange={(e) => setReserveDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReserveModalRoom(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold"
                >
                  Confirmer la réservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Resident Stay Card Modal */}
      {printingResident && (
        <ResidentCardModal
          resident={printingResident}
          settings={db.settings}
          onClose={() => setPrintingResident(null)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`no-print fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-sm ${
            toast.type === 'err'
              ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-slate-900 dark:bg-white border-slate-800 dark:border-slate-200 text-white dark:text-slate-900'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
