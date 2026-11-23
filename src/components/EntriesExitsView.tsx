import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRightLeft, ArrowUpRight, Search } from 'lucide-react';
import { DatabaseState } from '../types';
import { formatDateTimeFR } from '../utils/date';

interface EntriesExitsViewProps {
  db: DatabaseState;
}

export const EntriesExitsView: React.FC<EntriesExitsViewProps> = ({ db }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entree' | 'sortie' | 'transfert'>('all');
  const [dateFilter, setDateFilter] = useState('');

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.entryExitLogs.filter((log) => {
      if (typeFilter !== 'all' && log.type !== typeFilter) return false;
      if (dateFilter) {
        const logDate = (log.exitTimestamp || log.entryTimestamp).slice(0, 10);
        if (logDate !== dateFilter) return false;
      }
      if (!q) return true;
      return (
        log.residentName.toLowerCase().includes(q) ||
        log.roomNumber.toLowerCase().includes(q) ||
        log.operator.toLowerCase().includes(q)
      );
    });
  }, [db.entryExitLogs, search, typeFilter, dateFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Registre des entrées et sorties
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Journal chronologique des arrivées, départs et mouvements de chambres.
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, chambre, opérateur..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="all">Tous les mouvements</option>
          <option value="entree">Entrées uniquement</option>
          <option value="sortie">Sorties uniquement</option>
          <option value="transfert">Transferts uniquement</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4">Mouvement</th>
                <th className="py-3 px-4">Résident</th>
                <th className="py-3 px-4">Chambre</th>
                <th className="py-3 px-4">Date & Heure d’entrée</th>
                <th className="py-3 px-4">Date & Heure de sortie</th>
                <th className="py-3 px-4 text-right">Durée</th>
                <th className="py-3 px-4">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    Aucun mouvement enregistré pour ces filtres.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      {log.type === 'entree' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <ArrowDownRight className="w-4 h-4" />
                          Entrée
                        </span>
                      )}
                      {log.type === 'sortie' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400">
                          <ArrowUpRight className="w-4 h-4" />
                          Sortie
                        </span>
                      )}
                      {log.type === 'transfert' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                          <ArrowRightLeft className="w-4 h-4" />
                          Transfert
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {log.residentName}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {log.roomNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                      {formatDateTimeFR(log.entryTimestamp)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                      {formatDateTimeFR(log.exitTimestamp)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {log.stayDays} j
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{log.operator}</td>
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
