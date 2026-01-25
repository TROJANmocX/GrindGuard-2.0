import { useState } from 'react';
import { LogOut, User, RefreshCw, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { AppError, getErrorMessage } from '../utils/errors';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onSync: () => void;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: AppError | null;
}

export function Header({ currentView, onNavigate, onSync, isSyncing, lastSyncedAt, syncError }: HeaderProps) {
  const { signOut, profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'focus', label: 'Focus' },
    { id: 'progress', label: 'Progress' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-black border-b border-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button
            className="md:hidden text-zinc-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <span className="text-white font-semibold tracking-tight text-lg">GrindGuard</span>

          {/* Sync Status Button (Desktop) */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSyncing
              ? 'bg-zinc-800 text-zinc-400 cursor-wait'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 md:gap-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`text-sm font-medium transition-colors px-3 py-1.5 rounded-full ${currentView === item.id
                ? 'bg-white text-black'
                : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: User Actions */}
        <div className="flex items-center gap-4">

          {/* Mobile Sync Button (Icon Only) */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={`md:hidden flex items-center justify-center w-8 h-8 rounded-full ${isSyncing ? 'bg-zinc-800' : 'bg-zinc-900 text-zinc-400'}`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-zinc-500' : ''}`} />
          </button>

          {/* Trust Signal: Last Synced (Desktop Only) */}
          {lastSyncedAt && (
            <div
              className={`hidden lg:flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${syncError ? 'bg-red-900/20 border-red-800/30' : 'bg-zinc-900/50 border-zinc-800/50'}`}
              title={syncError ? getErrorMessage(syncError) : undefined}
            >
              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-ping' :
                syncError ? 'bg-red-500' :
                  (new Date().getTime() - lastSyncedAt.getTime() > 300000 ? 'bg-yellow-500' : 'bg-green-500')
                }`} />
              <span className={`${syncError ? 'text-red-400' : 'text-zinc-500'} font-medium`}>
                {isSyncing ? 'Syncing...' :
                  syncError ? `${syncError.type} - ${syncError.message.substring(0, 30)}...` :
                    `Synced ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 border-l border-zinc-800 pl-4 md:pl-6">
            {profile && (
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                <span className="font-medium text-gray-400">{profile.username}</span>
              </div>
            )}
            <button
              onClick={() => signOut()}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-black animate-fade-in absolute w-full left-0 z-40 shadow-2xl">
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === item.id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
              >
                {item.label}
              </button>
            ))}

            {/* Mobile User Info */}
            {profile && (
              <div className="flex items-center gap-3 px-4 py-3 mt-4 border-t border-zinc-900 text-zinc-500">
                <User className="w-4 h-4" />
                <span className="text-xs font-medium">{profile.username}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
