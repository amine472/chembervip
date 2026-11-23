import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  Moon,
  Power,
  ShieldCheck,
  Sun,
  Upload,
} from 'lucide-react';
import { AppSettings, AuthCredentials } from '../types';
import { ACCENT_PALETTES } from '../utils/i18n';
import { formatClockFR, formatFullDateFR } from '../utils/date';
import { AppLogo } from './DefaultLogo';

interface LoginViewProps {
  now: Date;
  settings: AppSettings;
  credentials: AuthCredentials;
  onLogin: (username: string, password: string) => Promise<{ ok: boolean; mustChange?: boolean; error?: string }>;
  onForcePasswordChange: (newUsername: string, newPassword: string) => Promise<void>;
  onUploadLogo: (dataUrl: string) => void;
  onToggleTheme: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  now,
  settings,
  credentials,
  onLogin,
  onForcePasswordChange,
  onUploadLogo,
  onToggleTheme,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exited, setExited] = useState(false);

  // Mandatory first-run password change modal state
  const [showForceChangeModal, setShowForceChangeModal] = useState(false);
  const [newUsername, setNewUsername] = useState(credentials.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const accent = ACCENT_PALETTES[settings.accentColor] || ACCENT_PALETTES.blue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Veuillez saisir votre nom d’utilisateur et votre mot de passe.');
      return;
    }
    setLoading(true);
    try {
      const res = await onLogin(username.trim(), password);
      if (!res.ok) {
        setError(res.error || 'Identifiants incorrects.');
      } else if (res.mustChange) {
        setNewUsername(credentials.username);
        setShowForceChangeModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForceChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    if (newUsername.trim().length < 3) {
      setChangeError('Le nom d’utilisateur doit contenir au moins 3 caractères.');
      return;
    }
    if (newPassword.length < 4) {
      setChangeError('Le nouveau mot de passe doit contenir au moins 4 caractères.');
      return;
    }
    if (newPassword === '0000') {
      setChangeError('Vous devez choisir un mot de passe différent du mot de passe par défaut (0000).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('La confirmation du mot de passe ne correspond pas.');
      return;
    }
    setSavingPassword(true);
    try {
      await onForcePasswordChange(newUsername.trim(), newPassword);
      setShowForceChangeModal(false);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La taille du logo ne doit pas dépasser 2 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (exited) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between bg-slate-50 dark:bg-slate-950 px-6 py-10">
        <div />
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-5">
          <div className="flex justify-center">
            <AppLogo logoDataUrl={settings.logoDataUrl} size="lg" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Session verrouillée
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Vous avez quitté l’application <span className="font-semibold">{settings.appName}</span>. Toutes vos données locales restent enregistrées en toute sécurité.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setExited(false);
              setPassword('');
              setError('');
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-colors ${accent.bgClass}`}
          >
            Revenir à l’écran de connexion
          </button>
        </div>
        <footer className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Conçu / Designed by <span className="font-semibold text-slate-700 dark:text-slate-200">ABDELHAKEM Lamine</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top utility strip */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3 min-w-0">
          <AppLogo logoDataUrl={settings.logoDataUrl} size="sm" />
          <span className="font-display font-bold text-sm sm:text-base tracking-tight truncate">
            {settings.appName}
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span>{formatFullDateFR(now)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
              {formatClockFR(now)}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Basculer le thème clair ou sombre"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {settings.themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main split / centered workspace */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {/* Left institutional panel */}
          <div className="lg:col-span-5 bg-slate-900 dark:bg-slate-950 text-white p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <AppLogo logoDataUrl={settings.logoDataUrl} size="lg" className="bg-white/10 border-white/15" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Changer le logo
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-blue-300">
                  {settings.organizationName}
                </p>
                <h1 className="font-display text-2xl font-bold tracking-tight leading-snug text-white">
                  {settings.appName}
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Système intégré d’administration des chambres, résidents, séjours, transferts, maintenance technique et rapports d’exploitation.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 space-y-2">
              <div className="font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
                {formatClockFR(now)}
              </div>
              <div className="text-xs text-slate-300">
                {formatFullDateFR(now)}
              </div>
            </div>
          </div>

          {/* Right login form */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Authentification requise
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Connectez-vous pour accéder au tableau de bord et aux opérations de la base de vie.
              </p>
            </div>

            {credentials.mustChangePassword && (
              <div className="mb-5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Première mise en service :</span> utilisez l’identifiant{' '}
                  <span className="font-mono font-bold">admin</span> et le mot de passe par défaut{' '}
                  <span className="font-mono font-bold">0000</span>. Un changement obligatoire sera demandé à la connexion.
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Nom d’utilisateur
                </label>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold text-white transition-colors whitespace-nowrap ${accent.bgClass} disabled:opacity-60`}
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'Vérification...' : 'Se connecter'}
                </button>
                <button
                  type="button"
                  onClick={() => setExited(true)}
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <Power className="w-4 h-4" />
                  Quitter
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Required Signature Footer */}
      <footer className="w-full px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500 dark:text-slate-400">
        Conçu / Designed by{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          ABDELHAKEM Lamine
        </span>
      </footer>

      {/* Mandatory First-Launch Default Password Change Modal */}
      {showForceChangeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="force-pwd-title"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3
                  id="force-pwd-title"
                  className="font-display text-lg font-bold text-slate-900 dark:text-white"
                >
                  Modification obligatoire du mot de passe
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Pour sécuriser l’accès au système lors du premier démarrage, vous devez remplacer le mot de passe par défaut (<span className="font-mono font-semibold">0000</span>) avant d’accéder au tableau de bord.
                </p>
              </div>
            </div>

            {changeError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                {changeError}
              </div>
            )}

            <form onSubmit={handleForceChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom d’utilisateur administrateur
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 4 caractères"
                    required
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-colors ${accent.bgClass}`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {savingPassword ? 'Enregistrement chiffré...' : 'Valider et accéder au système'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
