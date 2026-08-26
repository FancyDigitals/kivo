'use client';

import { useState, useRef, useEffect, use } from 'react';
import Link from 'next/link';
import FormattedWhatsAppMessage from '@/components/shared/FormattedMessage';
import {
  Bot,
  Send,
  RotateCcw,
  ArrowLeft,
  CheckCheck,
  Cpu,
  Clock,
  Info,
  ShieldCheck,
  AlertTriangle,
  Sliders,
} from 'lucide-react';

export default function BotTestSimulatorPage({ params }) {
  const unwrappedParams = use(params);
  const botId = unwrappedParams.botId;

  const [bot, setBot] = useState({
    id: botId,
    name: 'Fancy Assistant',
    businessName: 'Fancy Digitals',
    welcomeMessage: 'Welcome to *Fancy Digitals*! 🚀 How can I assist you with our AI automation, web development, or custom software services today?',
    personality: 'professional',
    primaryProvider: 'groq',
    primaryModel: 'llama-3.1-8b-instant',
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMeta, setLastMeta] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function loadSavedBotConfig() {
      try {
        const res = await fetch(`/api/bots/${botId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setBot(data.data);
          setMessages([
            {
              id: 'welcome',
              sender: 'bot',
              text: data.data.welcomeMessage || 'Welcome to *Fancy Digitals*!',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load saved bot config:', err);
      }
    }
    loadSavedBotConfig();
  }, [botId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const conversationPayload = [...messages, userMsg].map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await fetch(`/api/bots/${botId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationPayload,
        }),
      });

      const result = await res.json();

      if (result.success && result.data) {
        const botReply = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: result.data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botReply]);
        setLastMeta(result.data.metadata);
      } else {
        const errorText = result.error || 'Unknown AI Gateway Error';
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'system_error',
            text: `⚠️ AI Gateway Notice:\n${errorText}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'system_error',
          text: '⚠️ Network Connection Error: Unable to communicate with /api/bots/[botId]/test endpoint.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'bot',
        text: bot.welcomeMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setLastMeta(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/bots"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              WhatsApp Simulator — {bot.name}
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                Live AI Test
              </span>
            </h1>
            <p className="text-xs text-slate-500">Human WhatsApp formatting & direct conversational tone.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/bots/${botId}/customize`}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" /> Edit Settings
          </Link>
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Chat
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WhatsApp Frame */}
        <div className="lg:col-span-2 bg-[#efeae2] rounded-2xl border border-slate-300 shadow-lg overflow-hidden flex flex-col h-[620px] relative">
          <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm leading-none">{bot.name}</p>
                <p className="text-[11px] text-emerald-200 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {bot.businessName} (Official Account)
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#00000008_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isError = msg.sender === 'system_error';

              if (isError) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="max-w-[90%] bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 text-xs shadow-sm space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        AI Gateway Configuration
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm shadow-sm relative ${
                      isUser
                        ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none'
                        : 'bg-white text-slate-900 rounded-tl-none'
                    }`}
                  >
                    {/* Render message through WhatsApp text formatter */}
                    <FormattedWhatsAppMessage text={msg.text} />

                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 font-medium">
                      <span>{msg.time}</span>
                      {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-xl px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  {bot.name} is typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="bg-[#f0f0f0] p-3 border-t border-slate-300 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Type a message as a customer..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#075e54]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-[#075e54] hover:bg-[#064e46] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Telemetry */}
<div className="space-y-4">
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
      <Cpu className="w-4 h-4 text-emerald-600" />
      AI Gateway Telemetry
    </h3>
    <p className="text-xs text-slate-500 mt-0.5">Real-time metadata for the last response.</p>

    {lastMeta ? (
      <div className="mt-4 space-y-3 text-xs">
        <div className="flex justify-between py-1.5 border-b border-slate-100">
          <span className="text-slate-500">Provider</span>
          <span className="font-semibold text-slate-900 uppercase">{lastMeta.provider}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-100">
          <span className="text-slate-500">Model</span>
          <span className="font-mono font-semibold text-slate-900 text-[11px]">{lastMeta.model}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-100">
          <span className="text-slate-500">Response Speed</span>
          <span className="font-semibold text-emerald-600 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {lastMeta.latencyMs} ms
          </span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-slate-500">Tokens Processed</span>
          <span className="font-semibold text-slate-900">{lastMeta.totalTokens} tokens</span>
        </div>
      </div>
    ) : (
      <div className="mt-6 text-center py-6 border border-dashed border-slate-200 rounded-xl">
        <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-400 font-medium">Send a test message to inspect response latency & active model performance.</p>
      </div>
    )}
  </div>

  <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
      <ShieldCheck className="w-4 h-4" />
      Safety & Security Active
    </div>
    <p className="text-xs text-slate-300 leading-relaxed">
      Human WhatsApp Formatting Active (Single-Asterisk Bolding & Zero Robotic Dashes).
    </p>
  </div>
</div>
      </div>
    </div>
  );
}