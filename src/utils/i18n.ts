import { RoomStatus } from '../types';

/**
 * Dictionnaire linguistique structuré (Français actif).
 * Architecture prête pour l'ajout futur de la langue arabe (ar).
 */
export const ROOM_STATUS_META: Record<
  RoomStatus,
  {
    label: string;
    shortDesc: string;
    badgeBg: string;
    badgeText: string;
    tileBg: string;
    tileBorder: string;
    dotColor: string;
    hex: string;
  }
> = {
  libre: {
    label: 'Libre',
    shortDesc: 'Disponible pour accueil',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    tileBg: 'bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50',
    tileBorder: 'border-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-600',
    hex: '#16A34A',
  },
  occupee: {
    label: 'Occupée',
    shortDesc: 'Hébergement en cours',
    badgeBg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
    badgeText: 'text-red-700 dark:text-red-300',
    tileBg: 'bg-red-50/70 dark:bg-red-950/30 hover:bg-red-50 dark:hover:bg-red-950/50',
    tileBorder: 'border-red-300 dark:border-red-800',
    dotColor: 'bg-red-600',
    hex: '#DC2626',
  },
  maintenance: {
    label: 'En Maintenance',
    shortDesc: 'Intervention technique requise',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    badgeText: 'text-amber-700 dark:text-amber-300',
    tileBg: 'bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-50 dark:hover:bg-amber-950/50',
    tileBorder: 'border-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-600',
    hex: '#D97706',
  },
  nettoyage: {
    label: 'En Nettoyage',
    shortDesc: 'Remise en propreté en attente',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
    badgeText: 'text-blue-700 dark:text-blue-300',
    tileBg: 'bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50',
    tileBorder: 'border-blue-300 dark:border-blue-800',
    dotColor: 'bg-blue-600',
    hex: '#2563EB',
  },
  reservee: {
    label: 'Réservée',
    shortDesc: 'Attribuée pour arrivée prévue',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
    badgeText: 'text-violet-700 dark:text-violet-300',
    tileBg: 'bg-violet-50/70 dark:bg-violet-950/30 hover:bg-violet-50 dark:hover:bg-violet-950/50',
    tileBorder: 'border-violet-300 dark:border-violet-800',
    dotColor: 'bg-violet-600',
    hex: '#7C3AED',
  },
};

export const ACCENT_PALETTES = {
  blue: {
    name: 'Bleu Acier',
    primary: '#1d4ed8',
    bgClass: 'bg-blue-700 hover:bg-blue-800',
    textClass: 'text-blue-700 dark:text-blue-400',
    ringClass: 'focus:ring-blue-600',
    softBgClass: 'bg-blue-50 dark:bg-blue-950/40',
  },
  emerald: {
    name: 'Émeraude',
    primary: '#047857',
    bgClass: 'bg-emerald-700 hover:bg-emerald-800',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    ringClass: 'focus:ring-emerald-600',
    softBgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  indigo: {
    name: 'Indigo Exécutif',
    primary: '#4338ca',
    bgClass: 'bg-indigo-700 hover:bg-indigo-800',
    textClass: 'text-indigo-700 dark:text-indigo-400',
    ringClass: 'focus:ring-indigo-600',
    softBgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
  },
  slate: {
    name: 'Ardoise Sobre',
    primary: '#334155',
    bgClass: 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600',
    textClass: 'text-slate-700 dark:text-slate-300',
    ringClass: 'focus:ring-slate-600',
    softBgClass: 'bg-slate-100 dark:bg-slate-800/60',
  },
  amber: {
    name: 'Ambre Cuivre',
    primary: '#b45309',
    bgClass: 'bg-amber-700 hover:bg-amber-800',
    textClass: 'text-amber-700 dark:text-amber-400',
    ringClass: 'focus:ring-amber-600',
    softBgClass: 'bg-amber-50 dark:bg-amber-950/40',
  },
} as const;

export const MAINTENANCE_ISSUE_TYPES = [
  'Électricité',
  'Plomberie / Sanitaire',
  'Climatisation / Chauffage',
  'Menuiserie / Serrurerie',
  'Peinture / Maçonnerie',
  'Équipement mobilier',
  'Autre intervention',
];
