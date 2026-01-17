import { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, Bug, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    requestNotificationPermission,
    getDeadline,
    setDeadline,
    sendRuthlessNotification
} from '../lib/notifications';
import { parseStriverSheet, StriverProblem } from '../lib/csvParser';
import { getManualSolved, toggleManualSolved } from '../lib/storage';
import { extractSlugFromUrl } from '../utils/normalization';

export function Settings() {
    const { profile } = useAuth();
    const [enabled, setEnabled] = useState(false);
    const [time, setTime] = useState('20:00');
    const [status, setStatus] = useState<string>('');

    // Debug State
    const [striverData, setStriverData] = useState<StriverProblem[]>([]);
    const [manualSolvedSlugs, setManualSolvedSlugs] = useState<string[]>([]);

    useEffect(() => {
        // Load local settings
        const storedTime = getDeadline();
        setTime(storedTime);

        if (Notification.permission === 'granted') {
            setEnabled(true);
        }

        // Load Debug Data
        const loadDebug = async () => {
            const sheet = await parseStriverSheet();
            setStriverData(sheet.slice(0, 50)); // Increased to 50 for better manual control
            const manual = getManualSolved();
            setManualSolvedSlugs(manual);
        };
        loadDebug();

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

    const handleManualToggle = (problemUrl: string) => {
        const slug = extractSlugFromUrl(problemUrl);
        const newManual = toggleManualSolved(slug);
        setManualSolvedSlugs(newManual);
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-900 rounded-none p-6">
                <h2 className="text-xl font-bold text-white mb-6">Notifications</h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-4 border-b border-slate-900">
                        <div>
                            <p className="font-medium text-white text-sm">Daily Check-in</p>
                            <p className="text-xs text-slate-500">Receive a reminder to maintain your streak.</p>
                        </div>
                        <button
                            onClick={handleEnable}
                            disabled={enabled}
                            className={`px-4 py-2 rounded text-sm font-medium transition-all ${enabled
                                ? 'text-slate-500 cursor-default'
                                : 'bg-white text-black hover:bg-slate-200'
                                }`}
                        >
                            {enabled ? 'Active' : 'Enable'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-slate-900">
                        <div>
                            <p className="font-medium text-white text-sm">Reminder Time</p>
                            <p className="text-xs text-slate-500">When to send the alert.</p>
                        </div>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => handleTimeChange(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none focus:border-slate-600 font-mono text-sm"
                        />
                    </div>

                    {enabled && (
                        <button
                            onClick={handleTest}
                            className="text-xs text-slate-500 hover:text-white underline mt-4"
                        >
                            Send test notification
                        </button>
                    )}

                    {status && <p className="text-sm text-green-500 font-mono mt-2">{status}</p>}
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-slate-950 border border-slate-900 rounded-none p-6 mt-6">
                <h2 className="text-xl font-bold text-white mb-6">Data Management</h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-4 border-b border-slate-900">
                        <div>
                            <p className="font-medium text-white text-sm">Force Re-Sync</p>
                            <p className="text-xs text-slate-500">Fetch latest data from LeetCode & Update Analytics.</p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="px-4 py-2 bg-white text-black hover:bg-slate-200 rounded text-sm font-bold transition-all"
                        >
                            Re-Sync Now
                        </button>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-red-900/30">
                        <div>
                            <p className="font-medium text-red-500 text-sm">Danger Zone</p>
                            <p className="text-xs text-slate-500">Release all local progress and cached data.</p>
                        </div>
                        <button
                            onClick={() => {
                                if (confirm('⚠️ WARNING: This will completely wipe your local history and logout. Are you sure?')) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                            className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 rounded text-sm font-medium transition-all"
                        >
                            Wipe Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Developer / Debug Tools */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 opacity-75 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-slate-800 rounded-xl">
                        <Bug className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-300">Developer Tools</h2>
                        <p className="text-slate-500">Manual overrides & testing</p>
                    </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                        Manual Progress Toggle (First 50 Problems)
                    </p>
                    <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                        {striverData.map((prob, idx) => {
                            const slug = extractSlugFromUrl(prob.LeetCodeLink);
                            const isDone = manualSolvedSlugs.includes(slug);
                            return (
                                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-900 rounded cursor-pointer" onClick={() => handleManualToggle(prob.LeetCodeLink)}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isDone ? 'bg-green-500 border-green-500' : 'border-slate-600'
                                        }`}>
                                        {isDone && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <span className={`text-sm ${isDone ? 'text-green-500 line-through' : 'text-slate-400'}`}>
                                        {prob.QuestionName}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
