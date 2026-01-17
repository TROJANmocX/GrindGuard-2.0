import { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  requestNotificationPermission,
  getDeadline,
  setDeadline,
  sendRuthlessNotification
} from '../lib/notifications';

export function NotificationSettings() {
  const { profile } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('20:00');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    // Load local settings
    const storedTime = getDeadline();
    setTime(storedTime);

    if (Notification.permission === 'granted') {
      setEnabled(true);
    }
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setEnabled(granted);
    if (!granted) {
      setStatus('Permission denied. Please enable in browser settings.');
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    setDeadline(newTime);
    setStatus('Deadline updated.');
    setTimeout(() => setStatus(''), 2000);
  };

  const handleTest = () => {
    sendRuthlessNotification();
    setStatus('Test notification sent.');
    setTimeout(() => setStatus(''), 2000);
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 rounded-xl">
          <Bell className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Pressure System</h2>
          <p className="text-slate-400">Configure your daily deadline</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-semibold text-white">Enable Ruthless Reminders</p>
              <p className="text-sm text-slate-400">Receive aggressive alerts if you're lazy</p>
            </div>
          </div>
          <button
            onClick={handleEnable}
            disabled={enabled}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${enabled
                ? 'bg-green-500/10 text-green-500 cursor-default'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
          >
            {enabled ? 'Active' : 'Enable'}
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-semibold text-white">Deadline Time</p>
              <p className="text-sm text-slate-400">When the pressure starts</p>
            </div>
          </div>
          <input
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500"
          />
        </div>

        {enabled && (
          <button
            onClick={handleTest}
            className="text-xs text-orange-400 hover:text-orange-300 underline"
          >
            Send Test Notification
          </button>
        )}

        {status && <p className="text-sm text-green-400">{status}</p>}
      </div>
    </div>
  );
}
