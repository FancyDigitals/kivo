'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Loader2 } from 'lucide-react';

export default function WorkspaceSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: 'Fancy Digitals',
    notificationEmail: 'admin@fancydigitals.com',
    defaultCurrency: 'NGN',
    timezone: 'WAT (Lagos/London - UTC+1)',
    plan: 'Pro Agency Plan',
  });

  useEffect(() => {
    async function loadWorkspaceSettings() {
      try {
        const res = await fetch('/api/workspaces');
        const data = await res.json();
        if (data.success && data.data) {
          setFormData(data.data);
        }
      } catch (err) {
        console.error('Failed to load workspace settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkspaceSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/workspaces', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.success) {
        setSaved(true);
        // Trigger a global custom event so the Dashboard Layout Sidebar updates immediately
        window.dispatchEvent(new Event('workspace-updated'));
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(result.error || 'Failed to update workspace settings');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating workspace settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-400 text-sm">Loading workspace settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage workspace identity, currency preferences, and notification defaults.</p>
        </div>

        {saved && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Workspace Settings Updated!
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">General Configuration</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Workspace / Brand Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notification Email</label>
              <input
                type="email"
                value={formData.notificationEmail}
                onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Currency</label>
              <select
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
              >
                <option value="NGN">NGN (₦ - Naira)</option>
                <option value="USD">USD ($ - US Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Workspace Settings
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            Active Subscription
          </span>
          <h3 className="text-lg font-bold mt-2">{formData.plan || 'Pro Agency Plan'}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Multi-Provider AI Gateway & High-Volume WhatsApp Ingestion Active.</p>
        </div>
      </div>
    </div>
  );
}