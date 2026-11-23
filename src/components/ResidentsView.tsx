import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  CreditCard,
  Edit3,
  Eye,
  LogOut,
  Plus,
  Search,
  UserCheck,
} from 'lucide-react';
import { DatabaseState, Resident, Room, RoomStatus } from '../types';
import {
  addDaysISO,
  calculateStayDays,
  calculateStayDaysInPeriod,
  daysRemainingUntil,
  formatDateFR,
  getTodayISO,
  normalizeName,
} from '../utils/date';

interface ResidentsViewProps {
  db: DatabaseState;
  preselectedRoomForAdd: Room | null;
  onClearPreselectedRoom: () => void;
  onSaveResident: (
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
  ) => void;
  onCheckoutResident: (resident: Resident, postRoomStatus: RoomStatus, exitDate: string) => void;
  onOpenTransferForResident: (resident: Resident) => void;
  onPrintResidentCard: (resident: Resident) => void;
}

export const ResidentsView: React.FC<ResidentsViewProps> = ({
  db,
  preselectedRoomForAdd,
  onClearPreselectedRoom,
  onSaveResident,
  onCheckoutResident,
  onOpenTransferForResident,
  onPrintResidentCard,
}) => {
  const today = getTodayISO();
  const [tab, setTab] = useState<'actif' | 'parti' | 'tous'>('actif');
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');

  // Period stay-days calculator
  const [periodStart, setPeriodStart] = useState(addDaysISO(today, -30));
  const [periodEnd, setPeriodEnd] = useState(today);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(Boolean(preselectedRoomForAdd));
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [roomId, setRoomId] = useState(preselectedRoomForAdd?.id || '');
  const [entryDate, setEntryDate] = useState(today);
  const [expectedExitDate, setExpectedExitDate] = useState(addDaysISO(today, 14));
  const [maxStayAlertDays, setMaxStayAlertDays] = useState(db.settings.maxStayAlertDays);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Duplicate inspection modal
  const [inspectingResident, setInspectingResident] = useState<Resident | null>(null);

  // Checkout modal
  const [checkoutTarget, setCheckoutTarget] = useState<Resident | null>(null);
  const [checkoutDate, setCheckoutDate] = useState(today);
  const [postCheckoutStatus, setPostCheckoutStatus] = useState<RoomStatus>('nettoyage');

  React.useEffect(() => {
    if (preselectedRoomForAdd) {
      setEditingResident(null);
      setFirstName('');
      setLastName('');
      setIdNumber('');
      setCompany('');
      setRole('');
      setPhone('');
      setRoomId(preselectedRoomForAdd.id);
      setEntryDate(today);
      setExpectedExitDate(addDaysISO(today, 14));
      setMaxStayAlertDays(db.settings.maxStayAlertDays);
      setNotes('');
      setFormError('');
      setModalOpen(true);
      onClearPreselectedRoom();
    }
  }, [preselectedRoomForAdd, db.settings.maxStayAlertDays, onClearPreselectedRoom, today]);

  const activeResidents = useMemo(
    () => db.residents.filter((r) => r.status === 'actif'),
    [db.residents]
  );

  // Rooms that still have free capacity and are available for check-in
  const availableRooms = useMemo(() => {
    return db.rooms.filter((room) => {
      if (room.status === 'maintenance' || room.status === 'nettoyage') return false;
      const occupants = activeResidents.filter(
        (r) => r.roomId === room.id && r.id !== editingResident?.id
      );
      return occupants.length < room.capacity;
    });
  }, [db.rooms, activeResidents, editingResident]);

  const companies = useMemo(() => {
    const set = new Set<string>();
    db.residents.forEach((r) => {
      if (r.company.trim()) set.add(r.company.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [db.residents]);

  const filteredResidents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.residents.filter((res) => {
      if (tab !== 'tous' && res.status !== tab) return false;
      if (companyFilter !== 'all' && res.company !== companyFilter) return false;
      if (roomTypeFilter !== 'all' && res.roomTypeLabel !== roomTypeFilter) return false;
      if (dateFilterFrom && res.entryDate < dateFilterFrom) return false;
      if (dateFilterTo && res.entryDate > dateFilterTo) return false;
      if (!q) return true;
      return (
        `${res.firstName} ${res.lastName}`.toLowerCase().includes(q) ||
        res.idNumber.toLowerCase().includes(q) ||
        res.company.toLowerCase().includes(q) ||
        res.roomNumber.toLowerCase().includes(q) ||
        res.role.toLowerCase().includes(q)
      );
    });
  }, [db.residents, tab, companyFilter, roomTypeFilter, dateFilterFrom, dateFilterTo, search]);

  const totalDaysInSelectedPeriod = useMemo(() => {
    if (!periodStart || !periodEnd) return 0;
    return filteredResidents.reduce(
      (sum, res) =>
        sum + calculateStayDaysInPeriod(res.entryDate, res.actualExitDate, periodStart, periodEnd),
      0
    );
  }, [filteredResidents, periodStart, periodEnd]);

  // Strict Duplicate Name Check
  const duplicateMatch = useMemo(() => {
    if (!firstName.trim() || !lastName.trim()) return null;
    const targetNorm = normalizeName(firstName, lastName);
    return (
      db.residents.find(
        (r) => r.id !== editingResident?.id && normalizeName(r.firstName, r.lastName) === targetNorm
      ) || null
    );
  }, [db.residents, firstName, lastName, editingResident]);

  const openAddModal = () => {
    setEditingResident(null);
    setFirstName('');
    setLastName('');
    setIdNumber('');
    setCompany('');
    setRole('');
    setPhone('');
    setRoomId(availableRooms[0]?.id || '');
    setEntryDate(today);
    setExpectedExitDate(addDaysISO(today, 14));
    setMaxStayAlertDays(db.settings.maxStayAlertDays);
    setNotes('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (res: Resident) => {
    setEditingResident(res);
    setFirstName(res.firstName);
    setLastName(res.lastName);
    setIdNumber(res.idNumber);
    setCompany(res.company);
    setRole(res.role);
    setPhone(res.phone);
    setRoomId(res.roomId || availableRooms[0]?.id || '');
    setEntryDate(res.entryDate);
    setExpectedExitDate(res.expectedExitDate);
    setMaxStayAlertDays(res.maxStayAlertDays || db.settings.maxStayAlertDays);
    setNotes(res.notes);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Le prénom et le nom du résident sont obligatoires.');
      return;
    }

    if (duplicateMatch) {
      setFormError(
        `Enregistrement bloqué : "${duplicateMatch.firstName} ${duplicateMatch.lastName}" existe déjà dans la base de données. Veuillez consulter son dossier existant.`
      );
      return;
    }

    if (!roomId) {
      setFormError('Veuillez sélectionner une chambre disponible.');
      return;
    }

    if (expectedExitDate && expectedExitDate < entryDate) {
      setFormError('La date de sortie prévue ne peut pas être antérieure à la date d’entrée.');
      return;
    }

    const selectedRoom = db.rooms.find((r) => r.id === roomId);
    if (!selectedRoom) {
      setFormError('Chambre sélectionnée introuvable.');
      return;
    }
    const currentOccupants = activeResidents.filter(
      (r) => r.roomId === selectedRoom.id && r.id !== editingResident?.id
    );
    if (currentOccupants.length >= selectedRoom.capacity) {
      setFormError(
        `Capacité maximale atteinte pour la chambre ${selectedRoom.number} (${selectedRoom.capacity} lit(s)).`
      );
      return;
    }

    onSaveResident(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim().toUpperCase(),
        idNumber: idNumber.trim(),
        company: company.trim(),
        role: role.trim(),
        phone: phone.trim(),
        roomId,
        entryDate,
        expectedExitDate,
        maxStayAlertDays: Math.max(1, maxStayAlertDays),
        notes: notes.trim(),
      },
      editingResident?.id
    );
    setModalOpen(false);
  };

  const handleReactivateFormerResident = (former: Resident) => {
    setEditingResident(former);
    setFirstName(former.firstName);
    setLastName(former.lastName);
    setIdNumber(former.idNumber);
    setCompany(former.company);
    setRole(former.role);
    setPhone(former.phone);
    setRoomId(availableRooms[0]?.id || '');
    setEntryDate(today);
    setExpectedExitDate(addDaysISO(today, 14));
    setMaxStayAlertDays(former.maxStayAlertDays || db.settings.maxStayAlertDays);
    setNotes(former.notes);
    setFormError('');
    setInspectingResident(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestion des résidents
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registre des résidents actuels, historique des séjours, prévention des doublons et calcul des durées.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Enregistrer un résident
        </button>
      </div>

      {/* Tabs + Period Stay Calculator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start">
          <button
            type="button"
            onClick={() => setTab('actif')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === 'actif'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Résidents actuels ({db.residents.filter((r) => r.status === 'actif').length})
          </button>
          <button
            type="button"
            onClick={() => setTab('parti')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === 'parti'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Historique ({db.residents.filter((r) => r.status === 'parti').length})
          </button>
          <button
            type="button"
            onClick={() => setTab('tous')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === 'tous'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Tous ({db.residents.length})
          </button>
        </div>

        {/* Period Stay Calculator */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Cumul jours du
          </span>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
          />
          <span className="text-slate-500">au</span>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
          />
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white tabular-nums">
            Total : {totalDaysInSelectedPeriod} jour{totalDaysInSelectedPeriod > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Advanced Search & Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, prénom, matricule, entreprise, chambre..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="all">Toutes les entreprises</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={roomTypeFilter}
          onChange={(e) => setRoomTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="all">Tous types de chambre</option>
          {db.roomTypes.map((rt) => (
            <option key={rt.id} value={rt.label}>
              {rt.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFilterFrom}
            onChange={(e) => setDateFilterFrom(e.target.value)}
            title="Entrée à partir du"
            className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
          />
          <input
            type="date"
            value={dateFilterTo}
            onChange={(e) => setDateFilterTo(e.target.value)}
            title="Entrée jusqu'au"
            className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
          />
        </div>
      </div>

      {/* Residents Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4">Résident</th>
                <th className="py-3 px-4">Entreprise & Poste</th>
                <th className="py-3 px-4">Chambre</th>
                <th className="py-3 px-4">Entrée</th>
                <th className="py-3 px-4">Sortie prévue / réelle</th>
                <th className="py-3 px-4 text-right">Durée séjour</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    Aucun résident trouvé pour ces critères.
                  </td>
                </tr>
              ) : (
                filteredResidents.map((res) => {
                  const stayDays = calculateStayDays(res.entryDate, res.actualExitDate);
                  const limit = res.maxStayAlertDays || db.settings.maxStayAlertDays;
                  const exceeded = res.status === 'actif' && stayDays > limit;
                  const rem = res.status === 'actif' ? daysRemainingUntil(res.expectedExitDate) : 99;

                  return (
                    <tr
                      key={res.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {res.firstName} {res.lastName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {res.idNumber ? `${res.idNumber} · ` : ''}
                          {res.phone || 'Téléphone non renseigné'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200">
                          {res.company || '—'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {res.role || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {res.roomNumber}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {res.roomTypeLabel}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums">
                        {formatDateFR(res.entryDate)}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                          {formatDateFR(res.actualExitDate || res.expectedExitDate)}
                        </div>
                        {res.status === 'parti' ? (
                          <span className="text-[11px] text-slate-500">Parti</span>
                        ) : rem < 0 ? (
                          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                            Date dépassée ({Math.abs(rem)} j)
                          </span>
                        ) : rem <= db.settings.departureAlertDays ? (
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            {rem === 0 ? "Départ aujourd'hui" : `Départ dans ${rem} j`}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {stayDays} j
                        </div>
                        {exceeded && (
                          <div className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                            Dépassement (&gt;{limit} j)
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onPrintResidentCard(res)}
                            title="Carte de séjour / Imprimer"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          {res.status === 'actif' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(res)}
                                title="Modifier"
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenTransferForResident(res)}
                                title="Transférer vers une autre chambre"
                                className="p-1.5 rounded-lg text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCheckoutTarget(res);
                                  setCheckoutDate(today);
                                  setPostCheckoutStatus('nettoyage');
                                }}
                                title="Enregistrer le départ"
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              >
                                <LogOut className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReactivateFormerResident(res)}
                              title="Nouvel hébergement pour cet ancien résident"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Réaccueillir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Resident Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden my-4">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {editingResident
                  ? `Dossier résident : ${editingResident.firstName} ${editingResident.lastName}`
                  : 'Enregistrer un nouveau résident'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {duplicateMatch && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-xs text-red-800 dark:text-red-200 space-y-2">
                  <div className="flex items-start gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Doublon détecté : « {duplicateMatch.firstName} {duplicateMatch.lastName} » est déjà enregistré(e) dans la base de données ({duplicateMatch.status === 'actif' ? `Actuellement en chambre ${duplicateMatch.roomNumber}` : `Ancien résident — dernier séjour chambre ${duplicateMatch.roomNumber}`}).
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    <button
                      type="button"
                      onClick={() => setInspectingResident(duplicateMatch)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-red-300 dark:border-red-700 font-semibold text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Consulter le dossier existant
                    </button>
                    {duplicateMatch.status === 'parti' && (
                      <button
                        type="button"
                        onClick={() => handleReactivateFormerResident(duplicateMatch)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Réutiliser ce dossier pour un nouveau séjour
                      </button>
                    )}
                  </div>
                </div>
              )}

              {formError && !duplicateMatch && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Ex: Sofiane"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Ex: MEZIANE"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    N° CIN / Matricule (optionnel)
                  </label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="Ex: MAT-4500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Entreprise / Société
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ex: Atlas Ingénierie"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Poste / Fonction
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Ingénieur HSE"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 0550 00 00 00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chambre attribuée *
                  </label>
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="">-- Sélectionner une chambre disponible --</option>
                    {availableRooms.map((rm) => {
                      const rt = db.roomTypes.find((t) => t.id === rm.typeId);
                      const occCount = activeResidents.filter(
                        (r) => r.roomId === rm.id && r.id !== editingResident?.id
                      ).length;
                      return (
                        <option key={rm.id} value={rm.id}>
                          {rm.number} — {rt?.label || rm.typeId} ({occCount}/{rm.capacity} lits)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date d’entrée *
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date de sortie prévue *
                  </label>
                  <input
                    type="date"
                    value={expectedExitDate}
                    onChange={(e) => setExpectedExitDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Seuil d’alerte (jours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={maxStayAlertDays}
                    onChange={(e) => setMaxStayAlertDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarques
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observations sur le séjour, consignes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={Boolean(duplicateMatch)}
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingResident ? 'Enregistrer' : 'Valider l’admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Duplicate Resident Modal */}
      {inspectingResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Dossier existant : {inspectingResident.firstName} {inspectingResident.lastName}
            </h4>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <strong>Statut :</strong>{' '}
                {inspectingResident.status === 'actif' ? 'Actuellement hébergé' : 'Ancien résident'}
              </div>
              <div>
                <strong>Chambre :</strong> {inspectingResident.roomNumber} ({inspectingResident.roomTypeLabel})
              </div>
              <div>
                <strong>Entreprise :</strong> {inspectingResident.company || '—'}
              </div>
              <div>
                <strong>Poste :</strong> {inspectingResident.role || '—'}
              </div>
              <div>
                <strong>Dernière entrée :</strong> {formatDateFR(inspectingResident.entryDate)}
              </div>
              <div>
                <strong>Sortie :</strong>{' '}
                {formatDateFR(inspectingResident.actualExitDate || inspectingResident.expectedExitDate)}
              </div>
              <div>
                <strong>Durée calculée :</strong>{' '}
                {calculateStayDays(inspectingResident.entryDate, inspectingResident.actualExitDate)} jours
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInspectingResident(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Confirmer le départ du résident
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Vous êtes sur le point d’enregistrer la sortie de{' '}
              <strong>
                {checkoutTarget.firstName} {checkoutTarget.lastName}
              </strong>{' '}
              de la chambre <strong className="font-mono">{checkoutTarget.roomNumber}</strong>.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date de départ effectif
                </label>
                <input
                  type="date"
                  value={checkoutDate}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  État de la chambre après départ (si totalement libérée)
                </label>
                <select
                  value={postCheckoutStatus}
                  onChange={(e) => setPostCheckoutStatus(e.target.value as RoomStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="nettoyage">En Nettoyage (recommandé)</option>
                  <option value="libre">Libre immédiatement</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onCheckoutResident(checkoutTarget, postCheckoutStatus, checkoutDate);
                  setCheckoutTarget(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Confirmer la sortie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
