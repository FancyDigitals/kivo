'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  Plus,
  FileText,
  Globe,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function BotKnowledgePage({ params }) {
  const unwrappedParams = use(params);
  const botId = unwrappedParams.botId;

  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'text', content: '', sourceUrl: '' });

  useEffect(() => {
    loadKnowledge();
  }, []);

  async function loadKnowledge() {
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      if (data.success && data.data) {
        setItems(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, botId }),
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ name: '', type: 'text', content: '', sourceUrl: '' });
        setIsModalOpen(false);
        loadKnowledge();
      } else {
        alert(data.error || 'Failed to ingest knowledge');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/bots"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Knowledge Base — Fancy Assistant
            </h1>
            <p className="text-xs text-slate-500">Teach your bot business policies, FAQs, and import website content.</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Add Knowledge Source
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.type === 'url' ? (
                  <Globe className="w-4 h-4 text-blue-600" />
                ) : (
                  <FileText className="w-4 h-4 text-emerald-600" />
                )}
                <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] uppercase font-mono font-semibold">
                  {item.type}
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Indexed & Ready
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-3">
              {item.content}
            </p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Add Knowledge Source</h2>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Knowledge Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="text">Text Document / FAQs</option>
                  <option value="url">Import Website URL</option>
                </select>
              </div>

              {formData.type === 'url' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://fancydigitals.com"
                    value={formData.sourceUrl}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Kivo will automatically crawl and extract main business content.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Source Name / Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Operating Hours, Refund Policy"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Content Text</label>
                    <textarea
                      rows={4}
                      placeholder="Paste details the bot should know when answering customers..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </>
              )}

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
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {formData.type === 'url' ? 'Crawl & Index Website' : 'Save Knowledge Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}