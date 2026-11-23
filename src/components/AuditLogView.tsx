import React, { useMemo, useState } from 'react';
import { History, Search } from 'lucide-react';
import { AuditLog, DatabaseState } from '../types';
import { formatDateTimeFR } from '../utils/date';

interface AuditLogViewProps {
  db: DatabaseState;
}

const CATEGORIES: AuditLog['category'][] = [
  'Connexion',
  'Chambres',
  'Résidents',
  'Transferts',
  'Maintenance',
  'Nettoyage',
  'Paramètres',
  'Sauvegarde',
];

export const AuditLogView: React.FC<AuditLogViewProps> = ({ db }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.auditLogs.filter((log) => {
      if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.username.toLowerCase().includes(q)
      );
    });
  }, [db.auditLogs, search, categoryFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Journal des opérations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Traçabilité complète de toutes les actions effectuées dans le système.
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une opération, chambre, résident, utilisateur..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="all">Toutes les catégories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Opération</th>
                <th className="py-3 px-4">Détails</th>
                <th className="py-3 px-4">Utilisateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    Aucune entrée dans le journal.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">
                      {formatDateTimeFR(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {log.username}
                    </td>
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
