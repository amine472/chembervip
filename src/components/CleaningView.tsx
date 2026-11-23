import React, { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Sparkles, X } from 'lucide-react';
import { CleaningRecord, DatabaseState, Room } from '../types';
import { formatDateFR, getTodayISO } from '../utils/date';

interface CleaningViewProps {
  db: DatabaseState;
  preselectedRoom: Room | null;
  onClearPreselectedRoom: () => void;
  onAddCleaning: (data: {
    roomId: string;
    startDate: string;
    agent: string;
    notes: string;
  }) => void;
  onCompleteCleaning: (record: CleaningRecord) => void;
}

export const CleaningView: React.FC<CleaningViewProps> = ({
  db,
  preselectedRoom,
  onClearPreselectedRoom,
  onAddCleaning,
  onCompleteCleaning,
}) => {
  const today = getTodayISO();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'termine'>('all');
  const [modalOpen, setModalOpen] = useState(Boolean(preselectedRoom));
  const [roomId, setRoomId] = useState(preselectedRoom?.id || '');
  const [startDate, setStartDate] = useState(today);
  const [agent, setAgent] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (preselectedRoom) {
      setRoomId(preselectedRoom.id);
      setModalOpen(true);
      onClearPreselectedRoom();
    }
  }, [preselectedRoom, onClearPreselectedRoom]);

  const activeResidents = useMemo(
    () => db.residents.filter((r) => r.status === 'actif'),
    [db.residents]
  );

  const eligibleRooms = useMemo(() => {
    return db.rooms.filter(
      (rm) => !activeResidents.some((res) => res.roomId === rm.id)
    );
  }, [db.rooms, activeResidents]);

  const filteredRecords = useMemo(() => {
    return db.cleanings.filter((c) => {
      if (filterStatus === 'pending') return c.status !== 'termine';
      if (filterStatus === 'termine') return c.status === 'termine';
      return true;
    });
  }, [db.cleanings, filterStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!roomId || !agent.trim()) {
      setError('La chambre et le nom de l’agent de nettoyage sont obligatoires.');
      return;
    }
    onAddCleaning({
      roomId,
      startDate,
      agent: agent.trim(),
      notes: notes.trim(),
    });
    setAgent('');
    setNotes('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestion du nettoyage
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des chambres en cours de nettoyage et validation avant remise en service.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRoomId(eligibleRooms[0]?.id || '');
            setError('');
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Planifier un nettoyage
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterStatus === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Toutes ({db.cleanings.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterStatus === 'pending'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          En attente / En cours ({db.cleanings.filter((c) => c.status !== 'termine').length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('termine')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterStatus === 'termine'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Terminées ({db.cleanings.filter((c) => c.status === 'termine').length})
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4">Chambre</th>
                <th className="py-3 px-4">Agent / Équipe</th>
                <th className="py-3 px-4">Début</th>
                <th className="py-3 px-4">Fin</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Remarques</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    Aucune tâche de nettoyage enregistrée.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {rec.roomNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {rec.agent}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums">
                      {formatDateFR(rec.startDate)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums">
                      {formatDateFR(rec.endDate)}
                    </td>
                    <td className="py-3 px-4">
                      {rec.status === 'termine' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                          Terminé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                          <Sparkles className="w-3 h-3" />
                          {rec.status === 'a_nettoyer' ? 'À nettoyer' : 'En cours'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {rec.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {rec.status !== 'termine' ? (
                        <button
                          type="button"
                          onClick={() => onCompleteCleaning(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmer & Libérer
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Validé</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cleaning Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Planifier un nettoyage
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1">Chambre *</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="">-- Choisir une chambre --</option>
                  {eligibleRooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.number} ({rm.name || 'Standard'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Agent / Équipe de nettoyage *</label>
                <input
                  type="text"
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  required
                  placeholder="Ex: Équipe Hygiène A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Date de début *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Remarques</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Literie, désinfection, contrôle sanitaire..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
                >
                  Placer en nettoyage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
