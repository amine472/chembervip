import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { DatabaseState } from '../types';
import {
  addDaysISO,
  calculateStayDays,
  calculateStayDaysInPeriod,
  formatDateFR,
  getTodayISO,
} from '../utils/date';
import { ROOM_STATUS_META } from '../utils/i18n';
import { exportToCSV, exportToExcelXLS } from '../utils/storage';
import { AppLogo } from './DefaultLogo';

type ReportTypeId =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'free_rooms'
  | 'occupied_rooms'
  | 'maintenance'
  | 'cleaning'
  | 'active_residents'
  | 'departures'
  | 'total_stay_days';

interface ReportsViewProps {
  db: DatabaseState;
}

const REPORT_OPTIONS: { id: ReportTypeId; label: string; group: string }[] = [
  { id: 'daily', label: 'Rapport journalier d’occupation', group: 'Périodiques' },
  { id: 'weekly', label: 'Rapport hebdomadaire (7 derniers jours)', group: 'Périodiques' },
  { id: 'monthly', label: 'Rapport mensuel (mois en cours)', group: 'Périodiques' },
  { id: 'yearly', label: 'Rapport annuel (année en cours)', group: 'Périodiques' },
  { id: 'free_rooms', label: 'Rapport des chambres libres', group: 'Parc Chambres' },
  { id: 'occupied_rooms', label: 'Rapport des chambres occupées', group: 'Parc Chambres' },
  { id: 'maintenance', label: 'Rapport de maintenance / réparations', group: 'Exploitation' },
  { id: 'cleaning', label: 'Rapport du nettoyage', group: 'Exploitation' },
  { id: 'active_residents', label: 'Rapport des résidents actuels', group: 'Résidents' },
  { id: 'departures', label: 'Rapport des départs (historique)', group: 'Résidents' },
  { id: 'total_stay_days', label: 'Rapport total des jours de séjour', group: 'Résidents' },
];

export const ReportsView: React.FC<ReportsViewProps> = ({ db }) => {
  const today = getTodayISO();
  const [selectedReport, setSelectedReport] = useState<ReportTypeId>('daily');
  const [customStart, setCustomStart] = useState(addDaysISO(today, -30));
  const [customEnd, setCustomEnd] = useState(today);

  const activeResidents = useMemo(
    () => db.residents.filter((r) => r.status === 'actif'),
    [db.residents]
  );

  const reportData = useMemo(() => {
    const now = new Date();
    const weekStart = addDaysISO(today, -6);
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const yearStart = `${now.getFullYear()}-01-01`;

    const buildOccupancyReport = (title: string, pStart: string, pEnd: string) => {
      const headers = [
        'Chambre',
        'Type',
        'Capacité',
        'Statut actuel',
        'Résident(s) concerné(s)',
        'Jours sur la période',
      ];
      const rows = db.rooms.map((rm) => {
        const rt = db.roomTypes.find((t) => t.id === rm.typeId);
        const relResidents = db.residents.filter(
          (res) =>
            (res.roomId === rm.id || res.roomNumber === rm.number) &&
            calculateStayDaysInPeriod(res.entryDate, res.actualExitDate, pStart, pEnd) > 0
        );
        const names = relResidents.map((r) => `${r.firstName} ${r.lastName}`).join(', ') || '—';
        const periodDays = relResidents.reduce(
          (s, r) => s + calculateStayDaysInPeriod(r.entryDate, r.actualExitDate, pStart, pEnd),
          0
        );
        return [
          rm.number,
          rt?.label || rm.typeId,
          `${rm.capacity} lit(s)`,
          ROOM_STATUS_META[rm.status].label,
          names,
          `${periodDays} j`,
        ];
      });
      const totalPeriodDays = db.residents.reduce(
        (s, r) => s + calculateStayDaysInPeriod(r.entryDate, r.actualExitDate, pStart, pEnd),
        0
      );
      return {
        title,
        subtitle: `Période du ${formatDateFR(pStart)} au ${formatDateFR(pEnd)}`,
        summary: [
          { label: 'Chambres totales', value: String(db.rooms.length) },
          {
            label: 'Chambres occupées',
            value: String(db.rooms.filter((r) => r.status === 'occupee').length),
          },
          { label: 'Résidents actifs', value: String(activeResidents.length) },
          { label: 'Total jours-résidents', value: `${totalPeriodDays} j` },
        ],
        headers,
        rows,
      };
    };

    switch (selectedReport) {
      case 'daily':
        return buildOccupancyReport("Rapport journalier d'occupation", today, today);
      case 'weekly':
        return buildOccupancyReport('Rapport hebdomadaire d’occupation', weekStart, today);
      case 'monthly':
        return buildOccupancyReport('Rapport mensuel d’occupation', monthStart, today);
      case 'yearly':
        return buildOccupancyReport('Rapport annuel d’occupation', yearStart, today);

      case 'free_rooms': {
        const free = db.rooms.filter((r) => r.status === 'libre');
        return {
          title: 'Rapport des chambres libres',
          subtitle: `Situation instantanée au ${formatDateFR(today)}`,
          summary: [
            { label: 'Chambres libres', value: String(free.length) },
            {
              label: 'Lits disponibles',
              value: String(free.reduce((s, r) => s + r.capacity, 0)),
            },
          ],
          headers: ['N° Chambre', 'Désignation', 'Type', 'Capacité', 'Observations'],
          rows: free.map((rm) => {
            const rt = db.roomTypes.find((t) => t.id === rm.typeId);
            return [rm.number, rm.name || '—', rt?.label || rm.typeId, `${rm.capacity} lit(s)`, rm.notes || 'Prête'];
          }),
        };
      }

      case 'occupied_rooms': {
        const occ = db.rooms.filter((r) => r.status === 'occupee');
        return {
          title: 'Rapport des chambres occupées',
          subtitle: `Situation au ${formatDateFR(today)}`,
          summary: [
            { label: 'Chambres occupées', value: String(occ.length) },
            { label: 'Résidents hébergés', value: String(activeResidents.length) },
          ],
          headers: ['N° Chambre', 'Type', 'Lits occupés', 'Résidents actuels', 'Dates d’entrée'],
          rows: occ.map((rm) => {
            const rt = db.roomTypes.find((t) => t.id === rm.typeId);
            const occupants = activeResidents.filter((r) => r.roomId === rm.id);
            return [
              rm.number,
              rt?.label || rm.typeId,
              `${occupants.length}/${rm.capacity}`,
              occupants.map((o) => `${o.firstName} ${o.lastName}`).join(', '),
              occupants.map((o) => formatDateFR(o.entryDate)).join(' / '),
            ];
          }),
        };
      }

      case 'maintenance':
        return {
          title: 'Rapport de maintenance et réparations',
          subtitle: `Total interventions : ${db.maintenances.length}`,
          summary: [
            {
              label: 'En cours',
              value: String(db.maintenances.filter((m) => m.status !== 'terminee').length),
            },
            {
              label: 'Terminées',
              value: String(db.maintenances.filter((m) => m.status === 'terminee').length),
            },
          ],
          headers: ['Chambre', 'Type de panne', 'Description', 'Responsable', 'Début', 'Fin', 'Statut'],
          rows: db.maintenances.map((m) => [
            m.roomNumber,
            m.issueType,
            m.description,
            m.technician,
            formatDateFR(m.startDate),
            formatDateFR(m.endDate),
            m.status === 'terminee' ? 'Terminée' : 'En cours',
          ]),
        };

      case 'cleaning':
        return {
          title: 'Rapport du nettoyage',
          subtitle: `Total tâches : ${db.cleanings.length}`,
          summary: [
            {
              label: 'En attente / cours',
              value: String(db.cleanings.filter((c) => c.status !== 'termine').length),
            },
            {
              label: 'Terminées',
              value: String(db.cleanings.filter((c) => c.status === 'termine').length),
            },
          ],
          headers: ['Chambre', 'Agent / Équipe', 'Début', 'Fin', 'Statut', 'Remarques'],
          rows: db.cleanings.map((c) => [
            c.roomNumber,
            c.agent,
            formatDateFR(c.startDate),
            formatDateFR(c.endDate),
            c.status === 'termine' ? 'Terminé' : 'En cours',
            c.notes || '—',
          ]),
        };

      case 'active_residents':
        return {
          title: 'Rapport des résidents actuels',
          subtitle: `Effectif présent au ${formatDateFR(today)}`,
          summary: [
            { label: 'Résidents actifs', value: String(activeResidents.length) },
            {
              label: 'Total jours cumulés',
              value: `${activeResidents.reduce((s, r) => s + calculateStayDays(r.entryDate), 0)} j`,
            },
          ],
          headers: [
            'Nom et Prénom',
            'Matricule',
            'Entreprise',
            'Poste',
            'Chambre',
            'Entrée',
            'Sortie prévue',
            'Durée (j)',
          ],
          rows: activeResidents.map((r) => [
            `${r.firstName} ${r.lastName}`,
            r.idNumber || '—',
            r.company || '—',
            r.role || '—',
            r.roomNumber,
            formatDateFR(r.entryDate),
            formatDateFR(r.expectedExitDate),
            calculateStayDays(r.entryDate),
          ]),
        };

      case 'departures': {
        const departed = db.residents.filter((r) => r.status === 'parti');
        return {
          title: 'Rapport des départs',
          subtitle: `Historique des résidents sortis (${departed.length})`,
          summary: [{ label: 'Total départs', value: String(departed.length) }],
          headers: ['Nom et Prénom', 'Entreprise', 'Chambre', 'Entrée', 'Départ réel', 'Durée séjour'],
          rows: departed.map((r) => [
            `${r.firstName} ${r.lastName}`,
            r.company || '—',
            r.roomNumber,
            formatDateFR(r.entryDate),
            formatDateFR(r.actualExitDate),
            `${calculateStayDays(r.entryDate, r.actualExitDate)} j`,
          ]),
        };
      }

      case 'total_stay_days': {
        const rows = db.residents
          .map((r) => {
            const days = calculateStayDaysInPeriod(
              r.entryDate,
              r.actualExitDate,
              customStart,
              customEnd
            );
            return { res: r, days };
          })
          .filter((item) => item.days > 0);
        const total = rows.reduce((s, i) => s + i.days, 0);
        return {
          title: 'Rapport total des jours de séjour',
          subtitle: `Période du ${formatDateFR(customStart)} au ${formatDateFR(customEnd)}`,
          summary: [
            { label: 'Résidents concernés', value: String(rows.length) },
            { label: 'Total jours de séjour', value: `${total} j` },
          ],
          headers: ['Résident', 'Entreprise', 'Chambre', 'Statut', 'Entrée', 'Sortie', 'Jours sur période'],
          rows: rows.map(({ res, days }) => [
            `${res.firstName} ${res.lastName}`,
            res.company || '—',
            res.roomNumber,
            res.status === 'actif' ? 'Actif' : 'Parti',
            formatDateFR(res.entryDate),
            formatDateFR(res.actualExitDate || res.expectedExitDate),
            days,
          ]),
        };
      }
    }
  }, [db, selectedReport, activeResidents, today, customStart, customEnd]);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportToExcelXLS(
      `rapport_${selectedReport}_${today}.xls`,
      reportData.title,
      db.settings.organizationName,
      reportData.headers,
      reportData.rows
    );
  };

  const handleExportCSV = () => {
    exportToCSV(`rapport_${selectedReport}_${today}.csv`, reportData.headers, reportData.rows);
  };

  return (
    <div className="space-y-6">
      {/* Controls hidden on print */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Rapports et statistiques
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Générez, imprimez et exportez les états officiels vers PDF, Excel ou CSV.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Printer className="w-4 h-4" />
              Imprimer / PDF
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exporter Excel (.xls)
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <FileText className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>

        {/* Report Selector Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Type de rapport à éditer
            </label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value as ReportTypeId)}
              className="w-full max-w-md px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
            >
              {REPORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  [{opt.group}] {opt.label}
                </option>
              ))}
            </select>
          </div>

          {selectedReport === 'total_stay_days' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Période :</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
              <span>au</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Printable Report Sheet */}
      <div className="print-container p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
        {/* Institutional Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <AppLogo logoDataUrl={db.settings.logoDataUrl} size="md" />
            <div>
              <div className="font-display text-sm font-bold uppercase text-slate-900 dark:text-white">
                {db.settings.appName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {db.settings.organizationName}
              </div>
            </div>
          </div>
          <div className="sm:text-right">
            <div className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {reportData.title}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {reportData.subtitle} · Édité le {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {reportData.summary.map((item) => (
            <div
              key={item.label}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">{item.label}</div>
              <div className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                {reportData.headers.map((h) => (
                  <th key={h} className="py-2.5 px-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reportData.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={reportData.headers.length}
                    className="py-8 text-center text-slate-500"
                  >
                    Aucune donnée disponible pour ce rapport.
                  </td>
                </tr>
              ) : (
                reportData.rows.map((row, idx) => (
                  <tr key={idx}>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-variant-numeric tabular-nums"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>{db.settings.organizationName}</span>
          <span>Conçu / Designed by ABDELHAKEM Lamine</span>
        </div>
      </div>
    </div>
  );
};
