'use client';

import { useState, useEffect } from 'react';
import { Zap, Plus, ArrowRight, CheckCircle2, Shield, Play } from 'lucide-react';

export default function AutomationsPage() {
  const [automations, setAutomations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    trigger: 'when_message_contains',
    condition: '',
    action: 'search_catalog_and_reply',
  });

  useEffect(() => {
    loadAutomations();
  }, []);

  async function loadAutomations() {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      if (data.success && data.data) setAutomations(data.data);
    } catch (err) {
      console.error(err);
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormData({ name: '', trigger: 'when_message_contains', condition: '', action: 'search_catalog_and_reply' });
        loadAutomations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Automation Engine</h1>
          <p className="text-sm text-slate-500 mt-1">Configure event-driven workflows, keyword triggers, and instant routing rules.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create Automation Workflow
        </button>
      </div>

      <div className="space-y-4">
        {automations.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{a.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  IF message matches: <strong className="text-slate-800 font-mono">"{a.condition}"</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold capitalize font-mono">
                THEN {a.action.replace(/_/g, ' ')}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase">
                Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Create Workflow Automation</h2>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Price Query Auto-Responder"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trigger Condition Keywords</label>
                <input
                  type="text"
                  placeholder="e.g. price, cost, fee, package"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Action</label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="search_catalog_and_reply">Search Product Catalog & Reply</option>
                  <option value="notify_team_and_switch_mode">Trigger Human Handoff Alert</option>
                  <option value="tag_customer_as_lead">Tag Customer as High-Intent Lead</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm"
                >
                  Save Automation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}