import React from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { DatabaseState, NavSection, Room } from '../types';
import {
  calculateStayDays,
  calculateStayDaysInPeriod,
  daysRemainingUntil,
  formatDateFR,
  getTodayISO,
} from '../utils/date';
import { ROOM_STATUS_META } from '../utils/i18n';

interface DashboardViewProps {
  db: DatabaseState;
  onNavigate: (section: NavSection) => void;
  onSelectRoom: (room: Room) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  db,
  onNavigate,
  onSelectRoom,
}) => {
  const today = getTodayISO();
  const activeResidents = db.residents.filter((r) => r.status === 'actif');

  const totalRooms = db.rooms.length;
  const occupiedRooms = db.rooms.filter((r) => r.status === 'occupee').length;
  const freeRooms = db.rooms.filter((r) => r.status === 'libre').length;
  const maintenanceRooms = db.rooms.filter((r) => r.status === 'maintenance').length;
  const cleaningRooms = db.rooms.filter((r) => r.status === 'nettoyage').length;
  const reservedRooms = db.rooms.filter((r) => r.status === 'reservee').length;

  const totalCapacity = db.rooms.reduce((sum, r) => sum + r.capacity, 0);
  const arrivalsToday = db.residents.filter((r) => r.entryDate === today).length;
  const departuresToday = db.residents.filter((r) => r.actualExitDate === today).length;

  const occupancyRateRooms = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const occupancyRateBeds =
    totalCapacity > 0 ? Math.round((activeResidents.length / totalCapacity) * 100) : 0;

  // Monthly occupancy estimate across current month
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const daysElapsedInMonth = now.getDate();
  const totalResidentDaysThisMonth = db.residents.reduce(
    (sum, r) => sum + calculateStayDaysInPeriod(r.entryDate, r.actualExitDate, monthStart, today),
    0
  );
  const maxBedDaysThisMonth = Math.max(1, totalCapacity * daysElapsedInMonth);
  const monthlyOccupancyRate = Math.min(
    100,
    Math.round((totalResidentDaysThisMonth / maxBedDaysThisMonth) * 100)
  );

  // Donut segments
  const statusSegments = [
    { key: 'occupee' as const, count: occupiedRooms, color: ROOM_STATUS_META.occupee.hex, label: 'Occupées' },
    { key: 'libre' as const, count: freeRooms, color: ROOM_STATUS_META.libre.hex, label: 'Libres' },
    { key: 'maintenance' as const, count: maintenanceRooms, color: ROOM_STATUS_META.maintenance.hex, label: 'En maintenance' },
    { key: 'nettoyage' as const, count: cleaningRooms, color: ROOM_STATUS_META.nettoyage.hex, label: 'En nettoyage' },
    { key: 'reservee' as const, count: reservedRooms, color: ROOM_STATUS_META.reservee.hex, label: 'Réservées' },
  ];

  // Residents by room type
  const typeDistribution = db.roomTypes.map((rt) => {
    const roomsOfType = db.rooms.filter((r) => r.typeId === rt.id);
    const bedsTotal = roomsOfType.reduce((s, r) => s + r.capacity, 0);
    const residentsInType = activeResidents.filter((res) =>
      roomsOfType.some((rm) => rm.id === res.roomId)
    ).length;
    return {
      id: rt.id,
      label: rt.label,
      roomCount: roomsOfType.length,
      residentsCount: residentsInType,
      bedsTotal,
    };
  });

  // Alerts: approaching departures & stay limit exceeded
  const departureAlerts = activeResidents
    .map((r) => {
      const rem = daysRemainingUntil(r.expectedExitDate);
      const stay = calculateStayDays(r.entryDate);
      const limit = r.maxStayAlertDays || db.settings.maxStayAlertDays;
      return { resident: r, daysLeft: rem, stayDays: stay, overLimit: stay > limit };
    })
    .filter((item) => item.daysLeft <= db.settings.departureAlertDays || item.overLimit)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Urgent rooms (maintenance + cleaning)
  const urgentRooms = db.rooms.filter(
    (r) => r.status === 'maintenance' || r.status === 'nettoyage'
  );

  // Most used rooms
  const mostUsedRooms = [...db.rooms]
    .sort((a, b) => b.totalDaysOccupied - a.totalDaysOccupied || b.totalStaysCount - a.totalStaysCount)
    .slice(0, 5);

  const kpiCards = [
    {
      label: 'Total des chambres',
      value: totalRooms,
      sub: `${totalCapacity} lits au total`,
      icon: Building2,
      iconClass: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
      target: 'rooms' as NavSection,
    },
    {
      label: 'Chambres occupées',
      value: occupiedRooms,
      sub: `${occupancyRateRooms}% du parc`,
      icon: BedDouble,
      iconClass: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50',
      target: 'room_map' as NavSection,
    },
    {
      label: 'Chambres libres',
      value: freeRooms,
      sub: 'Prêtes à accueillir',
      icon: CheckCircle2,
      iconClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
      target: 'room_map' as NavSection,
    },
    {
      label: 'En maintenance',
      value: maintenanceRooms,
      sub: 'Interventions techniques',
      icon: Wrench,
      iconClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
      target: 'maintenance' as NavSection,
    },
    {
      label: 'En nettoyage',
      value: cleaningRooms,
      sub: 'Remise en propreté',
      icon: Sparkles,
      iconClass: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
      target: 'cleaning' as NavSection,
    },
    {
      label: 'Résidents actuels',
      value: activeResidents.length,
      sub: `${occupancyRateBeds}% des lits occupés`,
      icon: Users,
      iconClass: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50',
      target: 'residents' as NavSection,
    },
    {
      label: "Arrivées aujourd'hui",
      value: arrivalsToday,
      sub: formatDateFR(today),
      icon: ArrowDownRight,
      iconClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
      target: 'entries_exits' as NavSection,
    },
    {
      label: "Départs aujourd'hui",
      value: departuresToday,
      sub: formatDateFR(today),
      icon: ArrowUpRight,
      iconClass: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
      target: 'entries_exits' as NavSection,
    },
  ];

  // SVG Donut calculation
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Vue synthétique en temps réel de l’occupation et des opérations de la base de vie.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('room_map')}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Plan des chambres
          </button>
          <button
            type="button"
            onClick={() => onNavigate('residents')}
            className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            Nouveau résident
          </button>
        </div>
      </div>

      {/* 8 Live KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onNavigate(card.target)}
              className="text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                  {card.label}
                </div>
                <div className="font-mono text-3xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                  {card.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {card.sub}
                </div>
              </div>
              <div className={`p-2.5 rounded-xl shrink-0 ${card.iconClass}`}>
                <Icon className="w-5 h-5" />
              </div>
            </button>
          );
        })}
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Occupancy Donut + Daily/Monthly Rates */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Taux d’occupation des chambres
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Répartition par statut et performance mensuelle
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 148 148" className="w-full h-full -rotate-90">
                <circle
                  cx="74"
                  cy="74"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="16"
                />
                {totalRooms > 0 &&
                  statusSegments.map((seg) => {
                    if (seg.count === 0) return null;
                    const segLength = (seg.count / totalRooms) * circumference;
                    const dashArray = `${segLength} ${circumference - segLength}`;
                    const dashOffset = -cumulativeOffset;
                    cumulativeOffset += segLength;
                    return (
                      <circle
                        key={seg.key}
                        cx="74"
                        cy="74"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="16"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                      />
                    );
                  })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {occupancyRateRooms}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Occupées</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2.5">
              {statusSegments.map((seg) => {
                const pct = totalRooms > 0 ? Math.round((seg.count / totalRooms) * 100) : 0;
                return (
                  <div key={seg.key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span>{seg.label}</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {seg.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <div className="text-slate-500 dark:text-slate-400">Occupation journalière (lits)</div>
              <div className="font-mono text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {occupancyRateBeds}%
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Taux d’occupation mensuel</div>
              <div className="font-mono text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {monthlyOccupancyRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Distribution by Room Type */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-6">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Répartition des résidents par type de chambre
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Nombre de personnes hébergées par rapport à la capacité disponible
            </p>
          </div>

          <div className="space-y-4">
            {typeDistribution.map((item) => {
              const pct =
                item.bedsTotal > 0 ? Math.round((item.residentsCount / item.bedsTotal) * 100) : 0;
              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.label}{' '}
                      <span className="font-normal text-slate-500 dark:text-slate-400">
                        · {item.roomCount} chambre{item.roomCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {item.residentsCount} / {item.bedsTotal} lits ({pct}%)
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Total journées-résidents ce mois :{' '}
              <strong className="font-mono text-slate-900 dark:text-white tabular-nums">
                {totalResidentDaysThisMonth} j
              </strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
            >
              Ouvrir les rapports détaillés →
            </button>
          </div>
        </div>
      </section>

      {/* Alerts + Urgent Rooms + Top Used Rooms */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alerts & Departures */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Alertes départs & durées de séjour
            </h2>
            <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
              {departureAlerts.length}
            </span>
          </div>

          {freeRooms > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2">
              <span>
                <strong>{freeRooms}</strong> chambre{freeRooms > 1 ? 's' : ''} libre{freeRooms > 1 ? 's' : ''} prête{freeRooms > 1 ? 's' : ''} pour accueil.
              </span>
              <button
                type="button"
                onClick={() => onNavigate('room_map')}
                className="font-semibold underline whitespace-nowrap"
              >
                Voir le plan
              </button>
            </div>
          )}

          {departureAlerts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
              Aucun départ imminent ni dépassement de séjour détecté.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {departureAlerts.slice(0, 5).map(({ resident, daysLeft, stayDays, overLimit }) => (
                <div key={resident.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {resident.firstName} {resident.lastName}{' '}
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        · {resident.roomNumber}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Sortie prévue : {formatDateFR(resident.expectedExitDate)} · Séjour :{' '}
                      <span className="font-mono tabular-nums">{stayDays} j</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {overLimit ? (
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        Séjour &gt; {resident.maxStayAlertDays || db.settings.maxStayAlertDays} j
                      </span>
                    ) : daysLeft < 0 ? (
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        Retard {Math.abs(daysLeft)} j
                      </span>
                    ) : daysLeft === 0 ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Départ aujourd’hui
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Dans {daysLeft} j
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgent Rooms Panel */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Interventions urgentes
            </h2>
            <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
              {urgentRooms.length}
            </span>
          </div>

          {urgentRooms.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
              Toutes les chambres sont opérationnelles.
            </p>
          ) : (
            <div className="space-y-2.5">
              {urgentRooms.map((rm) => {
                const meta = ROOM_STATUS_META[rm.status];
                return (
                  <button
                    key={rm.id}
                    type="button"
                    onClick={() => onSelectRoom(rm)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        Chambre {rm.number}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {rm.notes || meta.shortDesc}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold shrink-0 ${meta.badgeBg} ${meta.badgeText}`}
                    >
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Most Utilized Rooms */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Chambres les plus utilisées
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {mostUsedRooms.map((rm, idx) => (
              <button
                key={rm.id}
                type="button"
                onClick={() => onSelectRoom(rm)}
                className="w-full py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 px-1 rounded-lg transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    <span className="font-mono text-slate-400 mr-1.5">0{idx + 1}.</span>
                    <span className="font-mono">{rm.number}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {rm.totalStaysCount} séjours
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                  {rm.totalDaysOccupied} j
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
