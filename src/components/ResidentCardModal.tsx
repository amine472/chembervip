import React from 'react';
import { Printer, X } from 'lucide-react';
import { AppSettings, Resident } from '../types';
import { calculateStayDays, formatDateFR } from '../utils/date';
import { AppLogo } from './DefaultLogo';

interface ResidentCardModalProps {
  resident: Resident;
  settings: AppSettings;
  onClose: () => void;
}

export const ResidentCardModal: React.FC<ResidentCardModalProps> = ({
  resident,
  settings,
  onClose,
}) => {
  const stayDays = calculateStayDays(resident.entryDate, resident.actualExitDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden print-container">
        {/* Toolbar hidden on print */}
        <div className="no-print px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Carte d’hébergement du résident
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Stay Card */}
        <div className="p-8 bg-white text-slate-900 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-3">
              <AppLogo logoDataUrl={settings.logoDataUrl} size="md" />
              <div>
                <div className="font-display text-base font-bold uppercase tracking-tight text-slate-900">
                  {settings.appName}
                </div>
                <div className="text-xs text-slate-600">{settings.organizationName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Carte de Résident
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                N° {resident.idNumber || resident.id.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Nom et Prénom</div>
              <div className="font-bold text-base text-slate-900">
                {resident.firstName} {resident.lastName}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Statut d’hébergement</div>
              <div className="font-semibold text-slate-900">
                {resident.status === 'actif' ? 'Résident actuel' : 'Séjour clôturé'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Entreprise / Organisme</div>
              <div className="font-medium text-slate-900">{resident.company || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Poste / Fonction</div>
              <div className="font-medium text-slate-900">{resident.role || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Téléphone</div>
              <div className="font-mono text-slate-900">{resident.phone || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Chambre attribuée</div>
              <div className="font-mono font-bold text-slate-900">
                {resident.roomNumber} ({resident.roomTypeLabel})
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
            <div>
              <div className="text-xs text-slate-500">Date d’entrée</div>
              <div className="font-mono font-semibold text-slate-900">
                {formatDateFR(resident.entryDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">
                {resident.actualExitDate ? 'Date de départ' : 'Sortie prévue'}
              </div>
              <div className="font-mono font-semibold text-slate-900">
                {formatDateFR(resident.actualExitDate || resident.expectedExitDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Durée de séjour</div>
              <div className="font-mono font-bold text-blue-700 tabular-nums">
                {stayDays} jour{stayDays > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {resident.notes && (
            <div className="text-xs text-slate-600 border-t border-slate-200 pt-3">
              <span className="font-semibold text-slate-800">Observations : </span>
              {resident.notes}
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs text-slate-600">
            <div>
              <div className="font-semibold text-slate-800 mb-8">Signature du Résident</div>
              <div className="border-t border-slate-300 pt-1">Date et signature</div>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-8">
                Administration Base de Vie
              </div>
              <div className="border-t border-slate-300 pt-1">Cachet et visa responsable</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center pt-2">
            Édité le {new Date().toLocaleDateString('fr-FR')} — Conçu / Designed by ABDELHAKEM Lamine
          </div>
        </div>
      </div>
    </div>
  );
};
