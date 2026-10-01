'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare,
  Bot,
  Send,
  UserCheck,
  Phone,
  Search,
  Loader2,
  RefreshCw,
  Inbox,
} from 'lucide-react';

function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function initials(name, phone) {
  const n = (name || '').trim();
  if (n) return n.charAt(0).toUpperCase();
  const p = (phone || '').replace(/\D/g, '');
  return p.slice(-2) || '?';
}

export default function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const selectedConv = conversations.find((c) => c.id === selectedId) || null;

  const loadConversations = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/conversations', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load conversations');
      }
      const list = Array.isArray(data.data) ? data.data : [];
      setConversations(list);
      setSelectedId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list[0]?.id || null;
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load messages');
      }
      setMessages(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, 8000);
    return () => clearInterval(t);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    const t = setInterval(() => loadMessages(selectedId), 4000);
    return () => clearInterval(t);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedId]);

  const toggleMode = async () => {
    if (!selectedConv || toggling) return;
    const newMode = selectedConv.mode === 'human' ? 'ai' : 'human';
    setToggling(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          mode: newMode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update mode');
      }
      await loadConversations();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setToggling(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || !selectedConv || sending) return;

    if (selectedConv.mode !== 'human') {
      const ok = confirm(
        'Conversation is on AI mode. Switch to Human takeover and send?'
      );
      if (!ok) return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          newMessage: text,
          mode: 'human',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }
      setReplyText('');
      await Promise.all([loadConversations(), loadMessages(selectedConv.id)]);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.customerName || '').toLowerCase().includes(q) ||
      (c.phoneNumber || '').includes(q) ||
      (c.lastMessageSnippet || '').toLowerCase().includes(q) ||
      (c.botName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Left list */}
      <div className="w-full max-w-sm border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-bold text-slate-900 text-base">WhatsApp Inbox</h1>
              <p className="text-xs text-slate-500">
                Live chats from linked numbers · {conversations.length} threads
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoadingList(true);
                loadConversations();
              }}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-[#0080FF] hover:border-[#0080FF]/40"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, message..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0080FF]/30"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
          {loadingList && conversations.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-[#0080FF]" />
              Loading WhatsApp conversations...
            </div>
          ) : error ? (
            <div className="p-6 text-xs text-rose-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2 text-center text-slate-400 text-xs">
              <Inbox className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-slate-600">No conversations yet</p>
              <p>When customers message your linked WhatsApp bot, threads appear here.</p>
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = selectedId === c.id;
              const name = c.customerName || c.phoneNumber || 'Unknown';
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                    isSelected
                      ? 'bg-sky-50/80 border-l-4 border-[#0080FF]'
                      : 'hover:bg-slate-50/80 border-l-4 border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-[#00E5FF] flex items-center justify-center font-bold text-xs shrink-0">
                    {initials(c.customerName, c.phoneNumber)}
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {formatTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {c.lastMessageSnippet || 'No messages yet'}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          c.mode === 'human'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-50 text-sky-800'
                        }`}
                      >
                        {c.mode === 'human' ? 'Human' : 'AI'}
                      </span>
                      {c.botName && (
                        <span className="text-[9px] text-slate-400 truncate max-w-[100px]">
                          {c.botName}
                        </span>
                      )}
                      {c.channel === 'whatsapp' && (
                        <span className="text-[9px] text-emerald-600 font-semibold">
                          WhatsApp
                        </span>
                      )}
                      {Number(c.unreadCount) > 0 && (
                        <span className="ml-auto text-[9px] font-bold bg-[#0080FF] text-white px-1.5 py-0.5 rounded-full">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right pane */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#f0f2f5]/40">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-[#00E5FF] flex items-center justify-center font-bold text-xs shrink-0">
                {initials(selectedConv.customerName, selectedConv.phoneNumber)}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900 text-sm truncate">
                  {selectedConv.customerName || 'WhatsApp contact'}
                </h2>
                <p className="text-xs text-slate-500 font-mono flex items-center gap-1 truncate">
                  <Phone className="w-3 h-3 shrink-0" />
                  {selectedConv.phoneNumber || '—'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleMode}
              disabled={toggling}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 disabled:opacity-50 ${
                selectedConv.mode === 'human'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-sky-50 text-sky-800 border border-sky-200'
              }`}
            >
              {toggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : selectedConv.mode === 'human' ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" /> Human takeover
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5" /> AI handling
                </>
              )}
            </button>
          </div>

          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-2.5">
            {loadingMessages && messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No messages in this thread yet.
              </div>
            ) : (
              messages.map((m) => {
                const sender = (m.senderType || m.sender || '').toLowerCase();
                const isCustomer = sender === 'customer';
                const isHuman = sender === 'human' || sender === 'human_agent';
                const text = m.content || m.text || '';
                const time = m.createdAt || m.time;

                return (
                  <div
                    key={m.id}
                    className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] shadow-sm ${
                        isCustomer
                          ? 'bg-white text-slate-900 border border-slate-200 rounded-tl-md'
                          : isHuman
                          ? 'bg-amber-500 text-white rounded-tr-md'
                          : 'bg-[#0080FF] text-white rounded-tr-md'
                      }`}
                    >
                      {!isCustomer && (
                        <div className="text-[9px] font-bold uppercase opacity-80 mb-0.5">
                          {isHuman ? 'Agent' : 'AI Bot'}
                        </div>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap break-words">
                        {text}
                      </p>
                      <div className="text-[9px] opacity-70 mt-1 text-right">
                        {formatTime(time)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSendReply}
            className="p-4 border-t border-slate-200 flex items-center gap-2 bg-white"
          >
            <input
              type="text"
              placeholder={
                selectedConv.mode === 'human'
                  ? 'Reply as human operator (sends on WhatsApp)...'
                  : 'Switch to Human takeover to reply manually...'
              }
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0080FF]/35"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              className="px-4 py-2.5 rounded-xl bg-[#0080FF] hover:bg-[#0066DD] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Send
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs gap-2 p-8">
          <MessageSquare className="w-10 h-10 text-slate-200" />
          Select a conversation to view WhatsApp history.
        </div>
      )}
    </div>
  );
}