'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  type: 'text',
  content: '',
  sourceUrl: '',
};

const TYPE_META = {
  text: {
    label: 'Text',
    icon: FileText,
    iconClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    description: 'FAQs, policies, business information and instructions',
  },
  url: {
    label: 'Website',
    icon: Globe,
    iconClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    description: 'Import content from a public website',
  },
};

export default function BotKnowledgePage({ params }) {
  const { botId } = use(params);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingItem, setEditingItem] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadKnowledge();
  }, [botId]);

  async function loadKnowledge() {
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/knowledge?botId=${encodeURIComponent(botId)}`,
        {
          cache: 'no-store',
        }
      );

      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('[knowledge] load failed:', err);
      setError('Unable to load your knowledge base.');
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);

    setFormData({
      name: item.name || '',
      type: item.type || 'text',
      content: item.content || item.rawContent || '',
      sourceUrl: item.sourceUrl || '',
    });

    setError('');
    setOpenMenu(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setError('');
  }

  async function handleSubmit(event) {
  event.preventDefault();

  setError('');
  setIsSubmitting(true);

  try {
    const payload = {
      ...formData,
      botId,
    };

    const isEditing = Boolean(editingItem?.id);

    const res = await fetch('/api/knowledge', {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        isEditing
          ? {
              ...payload,
              id: editingItem.id,
            }
          : payload
      ),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(
        data.error ||
          (isEditing
            ? 'Failed to update knowledge source.'
            : 'Failed to save knowledge source.')
      );
    }

    closeModal();
    await loadKnowledge();
  } catch (err) {
    console.error('[knowledge] save failed:', err);
    setError(err.message || 'Something went wrong.');
  } finally {
    setIsSubmitting(false);
  }
}

async function handleDelete(item) {
  if (!item?.id) return;

  const confirmed = window.confirm(
    `Delete "${item.name || 'this knowledge source'}"?\n\nThis cannot be undone.`
  );

  if (!confirmed) return;

  setError('');

  try {
    const res = await fetch('/api/knowledge', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: item.id,
        botId,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(
        data.error || 'Failed to delete knowledge source.'
      );
    }

    setOpenMenu(null);

    setItems((current) =>
      current.filter((source) => source.id !== item.id)
    );
  } catch (err) {
    console.error('[knowledge] delete failed:', err);
    setError(err.message || 'Failed to delete knowledge source.');
  }
}

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFilter =
        filter === 'all' || item.type === filter;

      if (!matchesFilter) return false;

      if (!query) return true;

      return [
        item.name,
        item.content,
        item.rawContent,
        item.sourceUrl,
        item.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [items, search, filter]);

  const readyCount = items.filter(
    (item) => !item.status || item.status === 'ready'
  ).length;

  const websiteCount = items.filter(
    (item) => item.type === 'url'
  ).length;

  const textCount = items.filter(
    (item) => item.type !== 'url'
  ).length;

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">

        {/* HEADER */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Link
              href={`/bots/${botId}`}
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              aria-label="Back to bot"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                  Knowledge Base
                </h1>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {readyCount} ready
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                Give your bot the information it needs to answer customers
                accurately, naturally and consistently.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="hidden shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              Add knowledge
            </button>
          </div>

          {/* MOBILE ADD BUTTON */}
          <button
            onClick={openCreateModal}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 sm:hidden"
          >
            <Plus className="h-4 w-4" />
            Add knowledge
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Total sources"
            value={items.length}
          />

          <StatCard
            icon={CheckCircle2}
            label="Ready"
            value={readyCount}
            positive
          />

          <StatCard
            icon={FileText}
            label="Text sources"
            value={textCount}
          />

          <StatCard
            icon={Globe}
            label="Web sources"
            value={websiteCount}
          />
        </div>

        {/* GUIDANCE */}
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex gap-3 p-4 sm:p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-950">
                Keep your bot grounded in real information
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Add your business details, FAQs, pricing rules, policies,
                services and anything else customers commonly ask about.
                Clear, specific information gives the bot better context.
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your knowledge..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="relative">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 sm:w-44"
            >
              <option value="all">All sources</option>
              <option value="text">Text only</option>
              <option value="url">Websites only</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* ERROR */}
        {error && !isModalOpen && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* CONTENT */}
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
            <p className="mt-3 text-xs font-medium text-slate-500">
              Loading your knowledge base...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            hasItems={items.length > 0}
            onAdd={openCreateModal}
          />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <KnowledgeCard
                key={item.id}
                item={item}
                menuOpen={openMenu === item.id}
                onMenu={() =>
                  setOpenMenu(
                    openMenu === item.id ? null : item.id
                  )
                }
                onEdit={() => openEditModal(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </div>
        )}

        {/* FOOTNOTE */}
        {!isLoading && items.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium text-slate-400">
            <Clock3 className="h-3 w-3" />
            Knowledge is loaded for this bot when it handles customer messages.
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <KnowledgeModal
          formData={formData}
          setFormData={setFormData}
          editingItem={editingItem}
          isSubmitting={isSubmitting}
          error={error}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  positive = false,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>

        {positive && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 text-xl font-bold tracking-tight text-slate-950">
          {value}
        </p>
      </div>
    </div>
  );
}

function KnowledgeCard({
  item,
  menuOpen,
  onMenu,
  onEdit,
  onDelete,
}) {
  const type = item.type === 'url' ? 'url' : 'text';
  const meta = TYPE_META[type];
  const Icon = meta.icon;

  const content = item.content || item.rawContent || '';
  const status = item.status || 'ready';

  return (
    <article className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.bgClass}`}
        >
          <Icon className={`h-5 w-5 ${meta.iconClass}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-bold text-slate-950">
                  {item.name || 'Untitled knowledge'}
                </h3>

                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  {meta.label}
                </span>

                {status === 'ready' && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Ready
                  </span>
                )}
              </div>

              {item.sourceUrl && (
                <p className="mt-1 truncate text-[10px] text-blue-600">
                  {item.sourceUrl}
                </p>
              )}
            </div>

            <div className="relative self-end sm:self-start">
              <button
                onClick={onMenu}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Knowledge actions"
              >
                <span className="text-lg leading-none">•••</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <button
                    onClick={onEdit}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>

                  <button
                    onClick={onDelete}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {content && (
            <p className="mt-3 whitespace-pre-line line-clamp-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              {content}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-medium text-slate-400">
            <span>{content.length.toLocaleString()} characters</span>

            {item.updatedAt && (
              <span>
                Updated{' '}
                {new Date(item.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ hasItems, onAdd }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-emerald-400">
        {hasItems ? (
          <Search className="h-6 w-6" />
        ) : (
          <BookOpen className="h-6 w-6" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-950">
        {hasItems
          ? 'No knowledge matches your search'
          : 'Your knowledge base is empty'}
      </h3>

      <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">
        {hasItems
          ? 'Try another search term or change the source filter.'
          : 'Add FAQs, policies, business information or a website so your bot has reliable information to work with.'}
      </p>

      {!hasItems && (
        <button
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add your first source
        </button>
      )}
    </div>
  );
}

function KnowledgeModal({
  formData,
  setFormData,
  editingItem,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <BookOpen className="h-4 w-4" />
              </div>

              <h2 className="text-base font-bold text-slate-950">
                {editingItem
                  ? 'Edit knowledge'
                  : 'Add knowledge'}
              </h2>
            </div>

            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              Give your bot clear information it can use when answering customers.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-5 sm:p-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-5 text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700">
              What are you adding?
            </label>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_META).map(
                ([value, meta]) => {
                  const Icon = meta.icon;
                  const selected =
                    formData.type === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          type: value,
                        })
                      }
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          selected
                            ? meta.iconClass
                            : 'text-slate-400'
                        }`}
                      />

                      <p className="mt-2 text-xs font-bold text-slate-900">
                        {meta.label}
                      </p>

                      <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                        {meta.description}
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {formData.type === 'url' ? (
            <>
              <Field label="Website URL">
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      sourceUrl: event.target.value,
                    })
                  }
                  placeholder="https://example.com"
                  required
                  className="input"
                />
              </Field>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-5 text-blue-700">
                Use a public URL containing information your customers
                actually need. The crawler can then extract the useful
                business content.
              </div>
            </>
          ) : (
            <>
              <Field label="Source name">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      name: event.target.value,
                    })
                  }
                  placeholder="e.g. About Fancy Digitals"
                  required
                  className="input"
                />
              </Field>

              <Field label="Knowledge">
                <textarea
                  value={formData.content}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      content: event.target.value,
                    })
                  }
                  placeholder={`Example:

Fancy Digitals provides web development, graphic design, SEO and email marketing services.

Keep responses friendly and concise. Do not invent pricing. Ask for project details when someone wants a quote.`}
                  rows={10}
                  required
                  className="input resize-y leading-5"
                />

                <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
                  <span>
                    Write facts the bot should actually know.
                  </span>

                  <span>
                    {formData.content.length.toLocaleString()} chars
                  </span>
                </div>
              </Field>
            </>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}

              {editingItem
                ? 'Save changes'
                : formData.type === 'url'
                  ? 'Crawl & add website'
                  : 'Save knowledge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}