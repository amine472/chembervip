import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Edit3,
  Layers,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { DatabaseState, Room, RoomStatus, RoomTypeDefinition } from '../types';
import { calculateStayDays, formatDateFR } from '../utils/date';
import { ROOM_STATUS_META } from '../utils/i18n';

interface RoomsViewProps {
  db: DatabaseState;
  onSaveRoom: (roomData: Omit<Room, 'id' | 'totalStaysCount' | 'totalDaysOccupied' | 'createdAt'>, existingId?: string) => void;
  onDeleteRoom: (room: Room) => void;
  onAddRoomType: (typeData: Omit<RoomTypeDefinition, 'id' | 'isDefault'>) => void;
  onSelectRoom: (room: Room) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  db,
  onSaveRoom,
  onDeleteRoom,
  onAddRoomType,
  onSelectRoom,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Room Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState(db.roomTypes[0]?.id || 'type_vip');
  const [capacity, setCapacity] = useState(1);
  const [status, setStatus] = useState<RoomStatus>('libre');
  const [reservedFor, setReservedFor] = useState('');
  const [reservedDate, setReservedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Room Type Modal
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [newTypeCode, setNewTypeCode] = useState('');
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newTypeCapacity, setNewTypeCapacity] = useState(1);
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [typeError, setTypeError] = useState('');

  const activeResidents = useMemo(
    () => db.residents.filter((r) => r.status === 'actif'),
    [db.residents]
  );

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.rooms.filter((room) => {
      if (typeFilter !== 'all' && room.typeId !== typeFilter) return false;
      if (statusFilter !== 'all' && room.status !== statusFilter) return false;
      if (!q) return true;
      const occupants = activeResidents.filter((r) => r.roomId === room.id);
      const occMatch = occupants.some((o) =>
        `${o.firstName} ${o.lastName}`.toLowerCase().includes(q)
      );
      return (
        room.number.toLowerCase().includes(q) ||
        room.name.toLowerCase().includes(q) ||
        room.notes.toLowerCase().includes(q) ||
        occMatch
      );
    });
  }, [db.rooms, activeResidents, search, typeFilter, statusFilter]);

  const openAddModal = () => {
    const defaultType = db.roomTypes[0];
    setEditingRoom(null);
    setNumber('');
    setName('');
    setTypeId(defaultType?.id || 'type_vip');
    setCapacity(defaultType?.capacity || 1);
    setStatus('libre');
    setReservedFor('');
    setReservedDate('');
    setNotes('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setNumber(room.number);
    setName(room.name);
    setTypeId(room.typeId);
    setCapacity(room.capacity);
    setStatus(room.status);
    setReservedFor(room.reservedFor || '');
    setReservedDate(room.reservedDate || '');
    setNotes(room.notes);
    setFormError('');
    setModalOpen(true);
  };

  const handleTypeSelect = (selectedTypeId: string) => {
    setTypeId(selectedTypeId);
    const found = db.roomTypes.find((rt) => rt.id === selectedTypeId);
    if (found) {
      setCapacity(found.capacity);
    }
  };

  const handleSaveRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const trimmedNumber = number.trim().toUpperCase();
    if (!trimmedNumber) {
      setFormError('Le numéro de chambre est obligatoire.');
      return;
    }
    const duplicate = db.rooms.find(
      (r) => r.number.toLowerCase() === trimmedNumber.toLowerCase() && r.id !== editingRoom?.id
    );
    if (duplicate) {
      setFormError(`La chambre "${trimmedNumber}" existe déjà.`);
      return;
    }
    if (capacity < 1 || capacity > 20) {
      setFormError('Le nombre de lits doit être compris entre 1 et 20.');
      return;
    }
    if (editingRoom) {
      const currentOcc = activeResidents.filter((r) => r.roomId === editingRoom.id).length;
      if (capacity < currentOcc) {
        setFormError(
          `Impossible de réduire la capacité à ${capacity} lit(s) car ${currentOcc} résident(s) occupent actuellement cette chambre.`
        );
        return;
      }
      if (currentOcc > 0 && status !== 'occupee') {
        setFormError(
          'Une chambre contenant des résidents actifs doit conserver le statut "Occupée".'
        );
        return;
      }
    }

    onSaveRoom(
      {
        number: trimmedNumber,
        name: name.trim(),
        typeId,
        capacity,
        status,
        notes: notes.trim(),
        reservedFor: status === 'reservee' ? reservedFor.trim() : undefined,
        reservedDate: status === 'reservee' ? reservedDate : undefined,
      },
      editingRoom?.id
    );
    setModalOpen(false);
  };

  const handleSaveNewType = (e: React.FormEvent) => {
    e.preventDefault();
    setTypeError('');
    if (!newTypeCode.trim() || !newTypeLabel.trim()) {
      setTypeError('Le code et le libellé du type de chambre sont obligatoires.');
      return;
    }
    const exists = db.roomTypes.some(
      (rt) =>
        rt.code.toLowerCase() === newTypeCode.trim().toLowerCase() ||
        rt.label.toLowerCase() === newTypeLabel.trim().toLowerCase()
    );
    if (exists) {
      setTypeError('Un type de chambre avec ce code ou libellé existe déjà.');
      return;
    }
    onAddRoomType({
      code: newTypeCode.trim().toUpperCase(),
      label: newTypeLabel.trim(),
      capacity: Math.max(1, newTypeCapacity),
      description: newTypeDesc.trim() || `Chambre de type ${newTypeLabel.trim()}`,
    });
    setNewTypeCode('');
    setNewTypeLabel('');
    setNewTypeCapacity(1);
    setNewTypeDesc('');
    setTypeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestion des chambres
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Administration des chambres VIP, Cadres, Doubles et types personnalisés.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTypeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Layers className="w-4 h-4" />
            Types de chambres ({db.roomTypes.length})
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Ajouter une chambre
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par numéro, nom, résident, remarque..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">Tous les types</option>
          {db.roomTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.label} ({rt.capacity} lit{rt.capacity > 1 ? 's' : ''})
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">Tous les statuts</option>
          {(Object.keys(ROOM_STATUS_META) as RoomStatus[]).map((st) => (
            <option key={st} value={st}>
              {ROOM_STATUS_META[st].label}
            </option>
          ))}
        </select>
      </div>

      {/* Rooms Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4">N° Chambre</th>
                <th className="py-3 px-4">Nom / Bloc</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Lits</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Résidents & Durée</th>
                <th className="py-3 px-4">Sortie prévue</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    Aucune chambre trouvée.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const meta = ROOM_STATUS_META[room.status];
                  const roomType = db.roomTypes.find((rt) => rt.id === room.typeId);
                  const occupants = activeResidents.filter((r) => r.roomId === room.id);

                  return (
                    <tr
                      key={room.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        <button
                          type="button"
                          onClick={() => onSelectRoom(room)}
                          className="hover:text-blue-700 dark:hover:text-blue-400 underline-offset-2 hover:underline"
                        >
                          {room.number}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {room.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {roomType?.label || room.typeId}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {occupants.length}/{room.capacity}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-semibold whitespace-nowrap ${meta.badgeBg} ${meta.badgeText}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {occupants.length === 0 ? (
                          <span className="text-xs text-slate-400">
                            {room.status === 'reservee' && room.reservedFor
                              ? `Réservée : ${room.reservedFor}`
                              : 'Aucun occupant'}
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {occupants.map((o) => (
                              <div key={o.id} className="text-xs flex items-center gap-2">
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {o.firstName} {o.lastName}
                                </span>
                                <span className="font-mono text-blue-700 dark:text-blue-400 font-semibold tabular-nums">
                                  ({calculateStayDays(o.entryDate)} j)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                        {occupants.length > 0
                          ? occupants.map((o) => formatDateFR(o.expectedExitDate)).join(' / ')
                          : room.reservedDate
                          ? formatDateFR(room.reservedDate)
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(room)}
                            title="Modifier la chambre"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRoom(room)}
                            disabled={occupants.length > 0}
                            title={
                              occupants.length > 0
                                ? 'Impossible de supprimer une chambre occupée'
                                : 'Supprimer la chambre'
                            }
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Add / Edit Room Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {editingRoom ? `Modifier la chambre ${editingRoom.number}` : 'Ajouter une chambre'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoomSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Numéro de chambre *
                  </label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Ex: V-104"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono uppercase text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom / Désignation
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Bloc A - Suite 04"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Type de chambre *
                  </label>
                  <select
                    value={typeId}
                    onChange={(e) => handleTypeSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    {db.roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de lits *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Statut de la chambre
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RoomStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  {(Object.keys(ROOM_STATUS_META) as RoomStatus[]).map((st) => (
                    <option key={st} value={st}>
                      {ROOM_STATUS_META[st].label} — {ROOM_STATUS_META[st].shortDesc}
                    </option>
                  ))}
                </select>
              </div>

              {status === 'reservee' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                  <div>
                    <label className="block text-xs font-semibold text-violet-900 dark:text-violet-200 mb-1">
                      Réservée pour
                    </label>
                    <input
                      type="text"
                      value={reservedFor}
                      onChange={(e) => setReservedFor(e.target.value)}
                      placeholder="Nom et prénom"
                      className="w-full px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-violet-900 dark:text-violet-200 mb-1">
                      Date d’arrivée prévue
                    </label>
                    <input
                      type="date"
                      value={reservedDate}
                      onChange={(e) => setReservedDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarques / Observations
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Équipements, détails particuliers..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
                >
                  {editingRoom ? 'Enregistrer les modifications' : 'Créer la chambre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Types Manager Modal */}
      {typeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Types de chambres configurés
              </h3>
              <button
                type="button"
                onClick={() => setTypeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                {db.roomTypes.map((rt) => (
                  <div
                    key={rt.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {rt.label}{' '}
                        <span className="font-mono text-xs text-slate-500">({rt.code})</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {rt.description}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0">
                      {rt.capacity} lit{rt.capacity > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSaveNewType}
                className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3"
              >
                <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Ajouter un nouveau type de chambre
                </h4>
                {typeError && (
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                    {typeError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newTypeCode}
                    onChange={(e) => setNewTypeCode(e.target.value)}
                    placeholder="Code (ex: SUITE)"
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono uppercase"
                  />
                  <input
                    type="text"
                    value={newTypeLabel}
                    onChange={(e) => setNewTypeLabel(e.target.value)}
                    placeholder="Libellé (ex: Suite Direction)"
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Capacité (lits)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newTypeCapacity}
                      onChange={(e) => setNewTypeCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={newTypeDesc}
                      onChange={(e) => setNewTypeDesc(e.target.value)}
                      placeholder="Description courte..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
                >
                  Ajouter ce type de chambre
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
