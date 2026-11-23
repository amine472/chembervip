import React, { useMemo, useState } from 'react';
import { BedDouble, Search, Users } from 'lucide-react';
import { DatabaseState, Room, RoomStatus } from '../types';
import { calculateStayDays } from '../utils/date';
import { ROOM_STATUS_META } from '../utils/i18n';

interface RoomMapViewProps {
  db: DatabaseState;
  onSelectRoom: (room: Room) => void;
}

export const RoomMapView: React.FC<RoomMapViewProps> = ({ db, onSelectRoom }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all');

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
      const occupantMatch = occupants.some((o) =>
        `${o.firstName} ${o.lastName} ${o.company}`.toLowerCase().includes(q)
      );
      return (
        room.number.toLowerCase().includes(q) ||
        room.name.toLowerCase().includes(q) ||
        occupantMatch
      );
    });
  }, [db.rooms, activeResidents, search, typeFilter, statusFilter]);

  const statusOrder: RoomStatus[] = ['libre', 'occupee', 'maintenance', 'nettoyage', 'reservee'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Plan visuel des chambres
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cliquez sur une chambre pour consulter ses occupants, la durée de séjour ou effectuer une action.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="N° chambre ou nom du résident..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Filters & Color Legend */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Room Type Segmented Filter */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tous les types ({db.rooms.length})
            </button>
            {db.roomTypes.map((rt) => {
              const count = db.rooms.filter((r) => r.typeId === rt.id).length;
              return (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => setTypeFilter(rt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    typeFilter === rt.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {rt.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Tous statuts
            </button>
            {statusOrder.map((st) => {
              const meta = ROOM_STATUS_META[st];
              const count = db.rooms.filter((r) => r.status === st).length;
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(active ? 'all' : st)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? `${meta.badgeBg} ${meta.badgeText} ring-2 ring-offset-1 ring-slate-400`
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                  <span>{meta.label}</span>
                  <span className="font-mono text-[11px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Room Tiles Grid */}
      {filteredRooms.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
          Aucune chambre ne correspond aux critères sélectionnés.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const meta = ROOM_STATUS_META[room.status];
            const roomType = db.roomTypes.find((rt) => rt.id === room.typeId);
            const occupants = activeResidents.filter((r) => r.roomId === room.id);

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelectRoom(room)}
                className={`text-left p-5 rounded-2xl border transition-colors flex flex-col justify-between gap-4 min-h-[175px] ${meta.tileBg} ${meta.tileBorder}`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div>
                    <div className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                      {room.number}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[160px]">
                      {roomType?.label || room.typeId}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold shrink-0 ${meta.badgeBg} ${meta.badgeText}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                    {meta.label}
                  </span>
                </div>

                {/* Occupants or Status Detail */}
                <div className="space-y-1.5 w-full">
                  {occupants.length > 0 ? (
                    occupants.map((occ) => (
                      <div
                        key={occ.id}
                        className="flex items-center justify-between gap-2 text-xs bg-white/80 dark:bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-700/70"
                      >
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {occ.firstName} {occ.lastName}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-400 shrink-0 tabular-nums">
                          {calculateStayDays(occ.entryDate)} j
                        </span>
                      </div>
                    ))
                  ) : room.status === 'reservee' && room.reservedFor ? (
                    <div className="text-xs text-violet-900 dark:text-violet-200 bg-white/60 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                      Réservée : {room.reservedFor}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                      {room.notes || meta.shortDesc}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 w-full">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">
                      {occupants.length}/{room.capacity}
                    </span>{' '}
                    lit{room.capacity > 1 ? 's' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5" />
                    {room.name || 'Standard'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
