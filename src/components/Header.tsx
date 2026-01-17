import { LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  const { signOut, profile } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'focus', label: 'Focus' },
    { id: 'progress', label: 'Progress' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="bg-black border-b border-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Left: Brand */}
        <div className="flex items-center">
          <span className="text-white font-semibold tracking-tight text-lg">GrindGuard</span>
        </div>

        {/* Center: Navigation */}
        <nav className="flex items-center gap-2 md:gap-8 overflow-x-auto no-scrollbar">
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
        <div className="flex items-center gap-4 pl-4">
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
    </header>
  );
}
