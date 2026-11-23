import React, { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Wrench, X } from 'lucide-react';
import { DatabaseState, MaintenanceRecord, Room } from '../types';
import { formatDateFR, getTodayISO } from '../utils/date';
import { MAINTENANCE_ISSUE_TYPES } from '../utils/i18n';

interface MaintenanceViewProps {
  db: DatabaseState;
  preselectedRoom: Room | null;
  onClearPreselectedRoom: () => void;
  onAddMaintenance: (data: {
    roomId: string;
    issueType: string;
    description: string;
    startDate: string;
    technician: string;
    notes: string;
  }) => void;
  onCompleteMaintenance: (record: MaintenanceRecord, freeRoom: boolean) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  db,
  preselectedRoom,
  onClearPreselectedRoom,
  onAddMaintenance,
  onCompleteMaintenance,
}) => {
  const today = getTodayISO();
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'terminee'>('all');
  const [modalOpen, setModalOpen] = useState(Boolean(preselectedRoom));
  const [roomId, setRoomId] = useState(preselectedRoom?.id || '');
  const [issueType, setIssueType] = useState(MAINTENANCE_ISSUE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [technician, setTechnician] = useState('');
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

  // Eligible rooms for maintenance (cannot put occupied rooms directly in maintenance without moving residents)
  const eligibleRooms = useMemo(() => {
    return db.rooms.filter(
      (rm) => !activeResidents.some((res) => res.roomId === rm.id)
    );
  }, [db.rooms, activeResidents]);

  const filteredRecords = useMemo(() => {
    return db.maintenances.filter((m) => {
      if (filterStatus === 'active') return m.status !== 'terminee';
      if (filterStatus === 'terminee') return m.status === 'terminee';
      return true;
    });
  }, [db.maintenances, filterStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!roomId) {
      setError('Veuillez sélectionner une chambre.');
      return;
    }
    if (!description.trim() || !technician.trim()) {
      setError('La description de la panne et le nom du responsable sont obligatoires.');
      return;
    }
    onAddMaintenance({
      roomId,
      issueType,
      description: description.trim(),
      startDate,
      technician: technician.trim(),
      notes: notes.trim(),
    });
    setDescription('');
    setTechnician('');
    setNotes('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Maintenance et réparations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des pannes techniques et remise en disponibilité automatique après réparation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRoomId(eligibleRooms[0]?.id || '');
            setError('');
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Signaler une réparation
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
          Toutes ({db.maintenances.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('active')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterStatus === 'active'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          En cours ({db.maintenances.filter((m) => m.status !== 'terminee').length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('terminee')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterStatus === 'terminee'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Terminées ({db.maintenances.filter((m) => m.status === 'terminee').length})
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4">Chambre</th>
                <th className="py-3 px-4">Type de panne</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4">Début</th>
                <th className="py-3 px-4">Fin</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Aucune intervention de maintenance enregistrée.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {rec.roomNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {rec.issueType}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs">
                      <div>{rec.description}</div>
                      {rec.notes && (
                        <div className="text-xs text-slate-400 mt-0.5">{rec.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {rec.technician}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums">
                      {formatDateFR(rec.startDate)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums">
                      {formatDateFR(rec.endDate)}
                    </td>
                    <td className="py-3 px-4">
                      {rec.status === 'terminee' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                          Terminée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                          <Wrench className="w-3 h-3" />
                          En cours
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {rec.status !== 'terminee' ? (
                        <button
                          type="button"
                          onClick={() => onCompleteMaintenance(rec, true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Terminer & Libérer
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Clôturée</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Déclarer une intervention technique
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Chambre concernée *</label>
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
                  <label className="block text-xs font-semibold mb-1">Type de panne *</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    {MAINTENANCE_ISSUE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description de l’anomalie *</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Détails de la panne et travaux à prévoir..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Responsable / Technicien *</label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    required
                    placeholder="Ex: Équipe Plomberie"
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
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Remarques</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Pièces nécessaires, priorité..."
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                >
                  Placer en maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
