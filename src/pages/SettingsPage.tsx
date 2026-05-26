import { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  AlertTriangle,
  Database,
  CheckCircle,
} from 'lucide-react';
import { settingsStorage, backupRestore } from '../lib/storage';
import type { AppSettings } from '../types';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function InputField({ label, value, onChange, placeholder }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
      />
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(() => settingsStorage.get());
  const [saved, setSaved] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [restoreSuccess, setRestoreSuccess] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    settingsStorage.save(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportBackup = () => {
    const json = backupRestore.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `islandpost-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const result = backupRestore.importAll(json);
      if (result.success) {
        setRestoreSuccess(result.message);
        setRestoreError('');
        setTimeout(() => setRestoreSuccess(''), 3000);
      } else {
        setRestoreError(result.message);
        setRestoreSuccess('');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-teal-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500">Configure your post office details and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Office Settings */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
            Office Information
          </h3>

          <InputField
            label="Office Name"
            value={settings.officeName}
            onChange={(v) => setSettings({ ...settings, officeName: v })}
            placeholder="Island Post Office"
          />
          <InputField
            label="Island / Location"
            value={settings.islandName}
            onChange={(v) => setSettings({ ...settings, islandName: v })}
            placeholder="Malé, Maldives"
          />
          <InputField
            label="Contact Number"
            value={settings.contactNumber}
            onChange={(v) => setSettings({ ...settings, contactNumber: v })}
            placeholder="+960 300-0000"
          />
          <InputField
            label="Email Address"
            value={settings.emailAddress}
            onChange={(v) => setSettings({ ...settings, emailAddress: v })}
            placeholder="info@islandpost.mv"
          />

          <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3 pt-2">
            Application Settings
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-700">Dark Mode</p>
                <p className="text-xs text-gray-500">Switch to dark interface theme</p>
              </div>
              <div
                onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
                className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${settings.darkMode ? 'bg-teal-500' : 'bg-gray-300'}`}
              >
                <div
                  className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${settings.darkMode ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-700">Auto Backup Reminder</p>
                <p className="text-xs text-gray-500">Show reminders to backup data</p>
              </div>
              <div
                onClick={() => setSettings({ ...settings, autoBackup: !settings.autoBackup })}
                className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${settings.autoBackup ? 'bg-teal-500' : 'bg-gray-300'}`}
              >
                <div
                  className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${settings.autoBackup ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 60 })}
              min={5}
              max={480}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${saved ? 'bg-green-600 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </form>

        {/* Backup & Restore */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Database className="w-4 h-4 text-teal-600" />
              <h3 className="text-base font-semibold text-gray-800">Database Backup</h3>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
              <p className="font-medium mb-1">📦 Local Storage Backup</p>
              <p className="text-xs text-blue-600">
                All data is stored locally in your browser. Regular backups are recommended to prevent data loss.
              </p>
            </div>

            {restoreError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {restoreError}
              </div>
            )}
            {restoreSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                {restoreSuccess}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Export Backup</p>
                <button
                  onClick={handleExportBackup}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Backup File (.json)
                </button>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Restore from Backup</p>
                <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  This will overwrite all current data
                </p>
                <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-sm font-medium text-amber-700 hover:bg-amber-100 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  Restore from Backup File
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleRestoreBackup}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">System Information</h3>
            <div className="space-y-2 text-xs font-mono">
              {[
                ['Version', 'IslandPost v1.0.0'],
                ['Storage', 'LocalStorage (Phase 1)'],
                ['Architecture', 'React + Vite + Tailwind'],
                ['Platform', 'Browser-based PWA'],
                ['Status', '🟢 Online'],
              ].map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-500">{key}</span>
                  <span className="text-slate-200">{value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-700 pt-3 text-xs text-slate-500">
              <p>Phase 2 upgrade path: PostgreSQL / Supabase</p>
              <p>Future: SMS notifications, QR scanning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
