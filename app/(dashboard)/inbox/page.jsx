'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  User,
  Bot,
  Send,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Phone,
  Search,
  CheckCheck,
} from 'lucide-react';

export default function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.success && data.data) {
        setConversations(data.data);
        if (data.data.length > 0 && !selectedConv) {
          setSelectedConv(data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  const toggleMode = async (newMode) => {
    if (!selectedConv) return;
    try {
      const res = await fetch('/api/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedConv.id, mode: newMode }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedConv(data.data);
        loadConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    try {
      const res = await fetch('/api/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          newMessage: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        setSelectedConv(data.data);
        loadConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Left List */}
      <div className="w-80 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h1 className="font-bold text-slate-900 text-base">WhatsApp Inbox</h1>
          <p className="text-xs text-slate-500">Live active conversations across all bots.</p>
        </div>

        <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
          {conversations.map((c) => {
            const isSelected = selectedConv?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedConv(c)}
                className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                  isSelected ? 'bg-slate-50 border-l-4 border-emerald-500' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {c.customerName.charAt(0)}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">{c.customerName}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{c.lastMessageAt}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {c.messages[c.messages.length - 1]?.text}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        c.mode === 'human'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {c.mode === 'human' ? 'Human Agent' : 'AI Active'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Conversation Window */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {selectedConv.customerName.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">{selectedConv.customerName}</h2>
                <p className="text-xs text-slate-500 font-mono">{selectedConv.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">Control Mode:</span>
              <button
                onClick={() => toggleMode(selectedConv.mode === 'ai' ? 'human' : 'ai')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  selectedConv.mode === 'human'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {selectedConv.mode === 'human' ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" /> Human Takeover
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5" /> AI Handling
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-slate-50/30">
            {selectedConv.messages.map((m) => {
              const isCustomer = m.sender === 'customer';
              const isHumanAgent = m.sender === 'human_agent';
              return (
                <div key={m.id} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-2.5 text-xs shadow-sm ${
                      isCustomer
                        ? 'bg-white text-slate-900 border border-slate-200'
                        : isHumanAgent
                        ? 'bg-amber-500 text-white font-medium'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    <p className="leading-relaxed">{m.text}</p>
                    <div className="text-[9px] opacity-70 mt-1 text-right">{m.time}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 flex items-center gap-2 bg-white">
            <input
              type="text"
              placeholder={
                selectedConv.mode === 'human'
                  ? 'Type response as Human Operator...'
                  : 'Take over conversation to reply manually...'
              }
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          Select a conversation to view chat history.
        </div>
      )}
    </div>
  );
}