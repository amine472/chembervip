import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Moon,
  RotateCcw,
  Save,
  Sun,
  Upload,
} from 'lucide-react';
import { AccentPaletteId, AppSettings, DatabaseState } from '../types';
import { formatDateTimeFR } from '../utils/date';
import { ACCENT_PALETTES } from '../utils/i18n';
import { exportBackupJSON, validateBackupJSON } from '../utils/storage';
import { AppLogo } from './DefaultLogo';

interface SettingsViewProps {
  db: DatabaseState;
  onUpdateSettings: (nextSettings: AppSettings) => void;
  onUpdateCredentials: (
    currentPassword: string,
    newUsername: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onRestoreBackup: (restored: DatabaseState) => void;
  onResetSeed: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  db,
  onUpdateSettings,
  onUpdateCredentials,
  onRestoreBackup,
  onResetSeed,
}) => {
  const [appName, setAppName] = useState(db.settings.appName);
  const [orgName, setOrgName] = useState(db.settings.organizationName);
  const [orgAddress, setOrgAddress] = useState(db.settings.organizationAddress);
  const [orgPhone, setOrgPhone] = useState(db.settings.organizationPhone);
  const [orgEmail, setOrgEmail] = useState(db.settings.organizationEmail);
  const [departureAlertDays, setDepartureAlertDays] = useState(db.settings.departureAlertDays);
  const [maxStayAlertDays, setMaxStayAlertDays] = useState(db.settings.maxStayAlertDays);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  // Credentials form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(db.credentials.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [credMsg, setCredMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Backup / Restore messages
  const [backupMsg, setBackupMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...db.settings,
      appName: appName.trim() || 'GESTION DE LA BASE DE VIE',
      organizationName: orgName.trim(),
      organizationAddress: orgAddress.trim(),
      organizationPhone: orgPhone.trim(),
      organizationEmail: orgEmail.trim(),
      departureAlertDays: Math.max(0, departureAlertDays),
      maxStayAlertDays: Math.max(1, maxStayAlertDays),
    });
    setSettingsSavedMsg('Paramètres enregistrés avec succès.');
    setTimeout(() => setSettingsSavedMsg(''), 3500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setBackupMsg({ type: 'err', text: 'Veuillez choisir une image valide (PNG, JPG, SVG).' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setBackupMsg({ type: 'err', text: 'La taille du logo ne doit pas dépasser 2 Mo.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateSettings({ ...db.settings, logoDataUrl: reader.result });
        setSettingsSavedMsg('Nouveau logo enregistré.');
        setTimeout(() => setSettingsSavedMsg(''), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredMsg(null);
    if (!currentPassword) {
      setCredMsg({ type: 'err', text: 'Veuillez saisir votre mot de passe actuel.' });
      return;
    }
    if (newUsername.trim().length < 3) {
      setCredMsg({
        type: 'err',
        text: 'Le nom d’utilisateur doit contenir au moins 3 caractères.',
      });
      return;
    }
    if (newPassword && newPassword.length < 4) {
      setCredMsg({
        type: 'err',
        text: 'Le nouveau mot de passe doit contenir au moins 4 caractères.',
      });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setCredMsg({ type: 'err', text: 'La confirmation du mot de passe ne correspond pas.' });
      return;
    }
    const res = await onUpdateCredentials(
      currentPassword,
      newUsername.trim(),
      newPassword || currentPassword
    );
    if (!res.ok) {
      setCredMsg({ type: 'err', text: res.error || 'Échec de la mise à jour.' });
    } else {
      setCredMsg({
        type: 'ok',
        text: 'Identifiants mis à jour et chiffrés avec succès.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const validated = validateBackupJSON(text);
        onRestoreBackup(validated);
        setBackupMsg({
          type: 'ok',
          text: `Sauvegarde restaurée (${validated.rooms.length} chambres, ${validated.residents.length} résidents).`,
        });
      } catch (err) {
        setBackupMsg({
          type: 'err',
          text:
            err instanceof Error
              ? err.message
              : 'Fichier de sauvegarde invalide ou corrompu.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Paramètres et sécurité
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configuration de l’établissement, personnalisation de l’interface, identifiants chiffrés et sauvegarde locale.
        </p>
      </div>

      {settingsSavedMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{settingsSavedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* General & Organization Settings */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Identité de l’établissement & Alertes
          </h2>

          {/* Logo management */}
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <AppLogo logoDataUrl={db.settings.logoDataUrl} size="lg" />
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Logo de l’établissement / Base de vie
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Importer un logo
                </button>
                {db.settings.logoDataUrl && (
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...db.settings, logoDataUrl: null })}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
                  >
                    Logo par défaut
                  </button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nom du programme</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Nom de l’établissement</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Adresse</label>
              <input
                type="text"
                value={orgAddress}
                onChange={(e) => setOrgAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Téléphone</label>
                <input
                  type="text"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">E-mail de contact</label>
                <input
                  type="email"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Alerte départ imminent (jours avant)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={departureAlertDays}
                  onChange={(e) => setDepartureAlertDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Durée max de séjour par défaut (jours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={maxStayAlertDays}
                  onChange={(e) => setMaxStayAlertDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
            >
              <Save className="w-4 h-4" />
              Enregistrer les paramètres
            </button>
          </form>
        </div>

        {/* Right Column: Appearance + Security + Backup */}
        <div className="lg:col-span-5 space-y-6">
          {/* Theme & Accent Color */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Apparence et couleurs
            </h2>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mode d’affichage
              </span>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...db.settings, themeMode: 'light' })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    db.settings.themeMode === 'light'
                      ? 'bg-white text-slate-900'
                      : 'text-slate-500'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Jour
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...db.settings, themeMode: 'dark' })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    db.settings.themeMode === 'dark'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Nuit
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Couleur d’accentuation de l’interface
              </span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ACCENT_PALETTES) as AccentPaletteId[]).map((pid) => {
                  const p = ACCENT_PALETTES[pid];
                  const selected = db.settings.accentColor === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => onUpdateSettings({ ...db.settings, accentColor: pid })}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                        selected
                          ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.primary }}
                      />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Security: Username & Password */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Identifiants de connexion
            </h2>

            {credMsg && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  credMsg.type === 'ok'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}
              >
                {credMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nom d’utilisateur</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Mot de passe actuel *</label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((p) => !p)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Nouveau mot de passe
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Optionnel si inchangé"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Confirmation</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répéter"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
              >
                Mettre à jour les identifiants
              </button>
            </form>
          </div>

          {/* Backup & Restore */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DatabaseBackup className="w-4 h-4 text-emerald-600" />
                Sauvegarde et restauration
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dernière sauvegarde locale automatique :{' '}
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {formatDateTimeFR(db.lastSavedAt)}
              </span>
            </p>

            {backupMsg && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  backupMsg.type === 'ok'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}
              >
                {backupMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => exportBackupJSON(db)}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
              >
                <Download className="w-4 h-4" />
                Créer une sauvegarde
              </button>

              <input
                ref={restoreInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => restoreInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Upload className="w-4 h-4" />
                Restaurer (.json)
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser les données initiales
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Reset Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Confirmer la réinitialisation ?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Cette action restaure les données de démonstration initiales. Créez une sauvegarde JSON avant de continuer si vous souhaitez conserver vos données actuelles.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetSeed();
                  setConfirmResetOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
