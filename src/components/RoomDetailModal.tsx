import React from 'react';
import {
  ArrowRightLeft,
  BedDouble,
  Calendar,
  CheckCircle2,
  Edit3,
  LogOut,
  Sparkles,
  UserPlus,
  Wrench,
  X,
} from 'lucide-react';
import { Resident, Room, RoomTypeDefinition } from '../types';
import { calculateStayDays, daysRemainingUntil, formatDateFR } from '../utils/date';
import { ROOM_STATUS_META } from '../utils/i18n';

interface RoomDetailModalProps {
  room: Room;
  roomType?: RoomTypeDefinition;
  occupants: Resident[];
  maxStayAlertDays: number;
  onClose: () => void;
  onAddResidentToRoom: (room: Room) => void;
  onCheckoutResident: (resident: Resident) => void;
  onTransferResident: (resident: Resident) => void;
  onSendToMaintenance: (room: Room) => void;
  onSendToCleaning: (room: Room) => void;
  onMarkRoomFree: (room: Room) => void;
  onReserveRoom: (room: Room) => void;
  onEditRoom: (room: Room) => void;
  onPrintResidentCard: (resident: Resident) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  roomType,
  occupants,
  maxStayAlertDays,
  onClose,
  onAddResidentToRoom,
  onCheckoutResident,
  onTransferResident,
  onSendToMaintenance,
  onSendToCleaning,
  onMarkRoomFree,
  onReserveRoom,
  onEditRoom,
  onPrintResidentCard,
}) => {
  const statusMeta = ROOM_STATUS_META[room.status];
  const freeBeds = Math.max(0, room.capacity - occupants.length);
  const canAssignResident =
    freeBeds > 0 && room.status !== 'maintenance' && room.status !== 'nettoyage';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                Chambre {room.number}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-semibold ${statusMeta.badgeBg} ${statusMeta.badgeText}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusMeta.dotColor}`} />
                {statusMeta.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {room.name || 'Sans nom'} · {roomType?.label || room.typeId} · Capacité : {occupants.length}/{room.capacity} lit(s)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Room metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="text-slate-500 dark:text-slate-400">Type</div>
              <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                {roomType?.label || room.typeId}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="text-slate-500 dark:text-slate-400">Lits occupés</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {occupants.length} / {room.capacity}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="text-slate-500 dark:text-slate-400">Séjours cumulés</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {room.totalStaysCount}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="text-slate-500 dark:text-slate-400">Jours cumulés</div>
              <div className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {room.totalDaysOccupied} j
              </div>
            </div>
          </div>

          {room.status === 'reservee' && room.reservedFor && (
            <div className="p-4 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/30 text-sm">
              <div className="font-semibold text-violet-900 dark:text-violet-200">
                Réservation active : {room.reservedFor}
              </div>
              {room.reservedDate && (
                <div className="text-xs text-violet-700 dark:text-violet-300 mt-1">
                  Arrivée prévue le {formatDateFR(room.reservedDate)}
                </div>
              )}
            </div>
          )}

          {room.notes && (
            <div className="text-sm text-slate-600 dark:text-slate-300 border-t border-b border-slate-100 dark:border-slate-800 py-3">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Remarques : </span>
              {room.notes}
            </div>
          )}

          {/* Occupants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Résidents actuels ({occupants.length})
              </h4>
              {canAssignResident && (
                <button
                  type="button"
                  onClick={() => onAddResidentToRoom(room)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Affecter un résident ({freeBeds} lit{freeBeds > 1 ? 's' : ''} libre{freeBeds > 1 ? 's' : ''})
                </button>
              )}
            </div>

            {occupants.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
                Aucun résident actuellement logé dans cette chambre.
              </div>
            ) : (
              <div className="space-y-3">
                {occupants.map((res, index) => {
                  const days = calculateStayDays(res.entryDate);
                  const limit = res.maxStayAlertDays || maxStayAlertDays;
                  const exceeded = days > limit;
                  const remaining = daysRemainingUntil(res.expectedExitDate);

                  return (
                    <div
                      key={res.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            Lit {index + 1}
                          </span>
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">
                            {res.firstName} {res.lastName}
                          </span>
                          <span className="text-xs font-mono font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                            {days} jour{days > 1 ? 's' : ''} de séjour
                          </span>
                          {exceeded && (
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                              · Dépassement (&gt;{limit} j)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {res.company || 'Société non précisée'} · {res.role || 'Poste non précisé'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                          <span>Entrée : {formatDateFR(res.entryDate)}</span>
                          <span>·</span>
                          <span>
                            Sortie prévue : {formatDateFR(res.expectedExitDate)}
                            {remaining < 0 && (
                              <span className="text-red-600 dark:text-red-400 font-semibold"> (Dépassée)</span>
                            )}
                            {remaining >= 0 && remaining <= 2 && (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                {' '}
                                ({remaining === 0 ? "Aujourd'hui" : `Dans ${remaining} j`})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onPrintResidentCard(res)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                        >
                          Carte
                        </button>
                        <button
                          type="button"
                          onClick={() => onTransferResident(res)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Transférer
                        </button>
                        <button
                          type="button"
                          onClick={() => onCheckoutResident(res)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sortie
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer quick status actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {occupants.length === 0 && room.status !== 'libre' && (
              <button
                type="button"
                onClick={() => onMarkRoomFree(room)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Rendre Libre
              </button>
            )}
            {occupants.length === 0 && room.status !== 'maintenance' && (
              <button
                type="button"
                onClick={() => onSendToMaintenance(room)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-medium transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                Maintenance
              </button>
            )}
            {occupants.length === 0 && room.status !== 'nettoyage' && (
              <button
                type="button"
                onClick={() => onSendToCleaning(room)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Nettoyage
              </button>
            )}
            {occupants.length === 0 && room.status === 'libre' && (
              <button
                type="button"
                onClick={() => onReserveRoom(room)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-800 text-violet-800 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-xs font-medium transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                Réserver
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onEditRoom(room)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Modifier la chambre
          </button>
        </div>
      </div>
    </div>
  );
};
