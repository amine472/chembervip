import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { DatabaseState, Resident } from '../types';
import { formatDateFR, getTodayISO } from '../utils/date';

interface TransfersViewProps {
  db: DatabaseState;
  preselectedResident: Resident | null;
  onClearPreselected: () => void;
  onExecuteTransfer: (
    residentId: string,
    toRoomId: string,
    transferDate: string,
    reason: string
  ) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  db,
  preselectedResident,
  onClearPreselected,
  onExecuteTransfer,
}) => {
  const today = getTodayISO();
  const activeResidents = useMemo(
    () => db.residents.filter((r) => r.status === 'actif'),
    [db.residents]
  );

  const [residentId, setResidentId] = useState(
    preselectedResident?.id || activeResidents[0]?.id || ''
  );
  const [toRoomId, setToRoomId] = useState('');
  const [transferDate, setTransferDate] = useState(today);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    if (preselectedResident) {
      setResidentId(preselectedResident.id);
      setToRoomId('');
      setError('');
      setSuccessMsg('');
      onClearPreselected();
    }
  }, [preselectedResident, onClearPreselected]);

  const selectedResident = activeResidents.find((r) => r.id === residentId) || null;

  const eligibleTargetRooms = useMemo(() => {
    return db.rooms.filter((room) => {
      if (selectedResident && room.id === selectedResident.roomId) return false;
      if (room.status === 'maintenance' || room.status === 'nettoyage') return false;
      const occCount = activeResidents.filter((r) => r.roomId === room.id).length;
      return occCount < room.capacity;
    });
  }, [db.rooms, activeResidents, selectedResident]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedResident) {
      setError('Veuillez sélectionner un résident actif.');
      return;
    }
    if (!toRoomId) {
      setError('Veuillez sélectionner la chambre de destination.');
      return;
    }
    if (!reason.trim()) {
      setError('Veuillez indiquer le motif du transfert.');
      return;
    }

    const targetRoom = db.rooms.find((r) => r.id === toRoomId);
    onExecuteTransfer(selectedResident.id, toRoomId, transferDate, reason.trim());
    setSuccessMsg(
      `Transfert confirmé : ${selectedResident.firstName} ${selectedResident.lastName} a été déplacé(e) vers la chambre ${targetRoom?.number || ''}.`
    );
    setToRoomId('');
    setReason('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Transfert des résidents
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Déplacez un résident vers une autre chambre disponible tout en conservant ses données et l’historique complet.
        </p>
      </div>

      {/* Transfer Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          Nouveau transfert de chambre
        </h2>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Résident à transférer *
            </label>
            <select
              value={residentId}
              onChange={(e) => {
                setResidentId(e.target.value);
                setToRoomId('');
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="">-- Choisir un résident --</option>
              {activeResidents.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.firstName} {res.lastName} (Actuelle : {res.roomNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chambre actuelle
            </label>
            <input
              type="text"
              readOnly
              value={
                selectedResident
                  ? `${selectedResident.roomNumber} (${selectedResident.roomTypeLabel})`
                  : '—'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-sm font-mono text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nouvelle chambre *
            </label>
            <select
              value={toRoomId}
              onChange={(e) => setToRoomId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="">-- Choisir la destination --</option>
              {eligibleTargetRooms.map((rm) => {
                const rt = db.roomTypes.find((t) => t.id === rm.typeId);
                const occ = activeResidents.filter((r) => r.roomId === rm.id).length;
                return (
                  <option key={rm.id} value={rm.id}>
                    {rm.number} — {rt?.label || rm.typeId} ({occ}/{rm.capacity} lits)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date du transfert *
            </label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motif du transfert *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Rapprochement d'équipe, maintenance climatisation, changement de grade..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors"
            >
              Confirmer le transfert
            </button>
          </div>
        </form>
      </div>

      {/* Historical Transfers Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Historique des transferts ({db.transfers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Résident</th>
                <th className="py-3 px-4">Chambre origine</th>
                <th className="py-3 px-4">Nouvelle chambre</th>
                <th className="py-3 px-4">Motif</th>
                <th className="py-3 px-4">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {db.transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Aucun transfert enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                db.transfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-xs tabular-nums">
                      {formatDateFR(tr.transferDate)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {tr.residentName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {tr.fromRoomNumber}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {tr.toRoomNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{tr.reason}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{tr.operator}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
