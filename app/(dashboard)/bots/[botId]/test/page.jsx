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
    welcomeMessage:
      'Welcome to *Fancy Digitals*! 🚀 How can I assist you with our AI automation, web development, or custom software services today?',
    personality: 'professional',
    primaryProvider: 'groq',
    primaryModel: 'llama-3.1-8b-instant',
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastMeta, setLastMeta] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    async function loadSavedBotConfig() {
      try {
        const res = await fetch(`/api/bots/${botId}`, {
          cache: 'no-store',
        });

        const data = await res.json();

        if (data.success && data.data) {
          setBot(data.data);

          setMessages([
            {
              id: 'welcome',
              sender: 'bot',
              text: data.data.welcomeMessage || 'Welcome!',
              time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
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
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  const getTime = () =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userText = input.trim();

    setInput('');

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText,
      time: getTime(),
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
        headers: {
          'Content-Type': 'application/json',
        },
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
          time: getTime(),
        };

        setMessages((prev) => [...prev, botReply]);
        setLastMeta(result.data.metadata);
      } else {
        const errorText =
          result.error || 'Unknown AI Gateway Error';

        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'system_error',
            text: `AI Gateway Notice:\n${errorText}`,
            time: getTime(),
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
          text:
            'Network Connection Error: Unable to communicate with the AI test endpoint.',
          time: getTime(),
        },
      ]);
    } finally {
      setIsLoading(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'bot',
        text: bot.welcomeMessage || 'Welcome!',
        time: getTime(),
      },
    ]);

    setLastMeta(null);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-0 sm:px-2 space-y-4 sm:space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-2.5 min-w-0">

          <Link
            href="/bots"
            aria-label="Back to bots"
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">

              <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                WhatsApp Simulator
              </h1>

              <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] font-bold border border-emerald-200">
                Live AI
              </span>

            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
              {bot.name} • {bot.businessName}
            </p>
          </div>

        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2">

          <Link
            href={`/bots/${botId}/customize`}
            className="h-9 sm:h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] sm:text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            Edit Settings
          </Link>

          <button
            type="button"
            onClick={handleReset}
            className="h-9 sm:h-10 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[11px] sm:text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Chat
          </button>

        </div>
      </div>

      {/* MAIN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* WHATSAPP */}
        <div className="lg:col-span-2 min-w-0">

          <div
            className="
              bg-[#efeae2]
              rounded-2xl
              border border-slate-300
              shadow-lg
              overflow-hidden
              flex flex-col
              h-[calc(100dvh-190px)]
              min-h-[480px]
              max-h-[760px]
              sm:h-[620px]
              relative
            "
          >

            {/* WHATSAPP HEADER */}
            <div className="bg-[#075e54] text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shrink-0 shadow-md">

              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">

                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
                  <Bot className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>

                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm leading-none truncate">
                    {bot.name}
                  </p>

                  <p className="text-[9px] sm:text-[11px] text-emerald-200 mt-1 flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="truncate">
                      {bot.businessName}
                    </span>
                  </p>
                </div>

              </div>

              <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure
              </div>

            </div>

            {/* MESSAGES */}
            <div
              className="
                flex-1
                min-h-0
                overflow-y-auto
                overscroll-contain
                px-2.5
                py-3
                sm:p-4
                space-y-2.5
                sm:space-y-3
                bg-[radial-gradient(#00000008_1px,transparent_1px)]
                [background-size:16px_16px]
              "
            >

              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const isError = msg.sender === 'system_error';

                if (isError) {
                  return (
                    <div
                      key={msg.id}
                      className="flex justify-center my-2"
                    >
                      <div className="w-full max-w-[92%] sm:max-w-[90%] bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-[11px] sm:text-xs shadow-sm">

                        <div className="flex items-center gap-1.5 font-bold text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          AI Gateway Configuration
                        </div>

                        <p className="whitespace-pre-wrap leading-relaxed mt-1.5">
                          {msg.text}
                        </p>

                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isUser
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >

                    <div
                      className={`
                        w-fit
                        max-w-[88%]
                        sm:max-w-[80%]
                        rounded-xl
                        px-3
                        sm:px-3.5
                        py-2
                        text-[13px]
                        sm:text-sm
                        shadow-sm
                        relative
                        break-words
                        overflow-hidden
                        ${
                          isUser
                            ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none'
                            : 'bg-white text-slate-900 rounded-tl-none'
                        }
                      `}
                    >

                      <FormattedWhatsAppMessage text={msg.text} />

                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] sm:text-[10px] text-slate-400 font-medium">
                        <span>{msg.time}</span>

                        {isUser && (
                          <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">

                  <div className="bg-white rounded-xl px-3.5 py-2.5 text-[11px] sm:text-xs text-slate-500 flex items-center gap-2 shadow-sm">

                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />

                    <span>
                      {bot.name} is typing...
                    </span>

                  </div>

                </div>
              )}

              <div ref={messagesEndRef} />

            </div>

            {/* INPUT */}
            <form
              onSubmit={handleSendMessage}
              className="bg-[#f0f0f0] p-2 sm:p-3 border-t border-slate-300 flex items-center gap-2 shrink-0"
            >

              <input
                ref={inputRef}
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="
                  min-w-0
                  flex-1
                  h-10
                  sm:h-11
                  px-3.5
                  sm:px-4
                  rounded-full
                  bg-white
                  border
                  border-slate-200
                  text-[13px]
                  sm:text-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#075e54]
                  focus:border-transparent
                "
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="
                  w-10
                  h-10
                  sm:w-11
                  sm:h-11
                  rounded-full
                  bg-[#075e54]
                  hover:bg-[#064e46]
                  active:bg-[#053f39]
                  disabled:opacity-40
                  text-white
                  flex
                  items-center
                  justify-center
                  shrink-0
                  transition-colors
                  shadow-sm
                "
              >
                <Send className="w-4 h-4" />
              </button>

            </form>

          </div>

        </div>

        {/* TELEMETRY */}
        <div className="space-y-4">

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">

            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              AI Gateway Telemetry
            </h3>

            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Real-time metadata for the last response.
            </p>

            {lastMeta ? (
              <div className="mt-4 space-y-2.5 text-xs">

                <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 shrink-0">
                    Provider
                  </span>

                  <span className="font-semibold text-slate-900 uppercase truncate">
                    {lastMeta.provider}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 shrink-0">
                    Model
                  </span>

                  <span className="font-mono font-semibold text-slate-900 text-[10px] truncate max-w-[60%]">
                    {lastMeta.model}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 shrink-0">
                    Response Speed
                  </span>

                  <span className="font-semibold text-emerald-600 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {lastMeta.latencyMs} ms
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-slate-500">
                    Tokens
                  </span>

                  <span className="font-semibold text-slate-900">
                    {lastMeta.totalTokens}
                  </span>
                </div>

              </div>
            ) : (
              <div className="mt-5 text-center py-6 border border-dashed border-slate-200 rounded-xl px-4">

                <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />

                <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-relaxed">
                  Send a test message to inspect response latency and active model performance.
                </p>

              </div>
            )}

          </div>

          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">

            <div className="flex items-center gap-2 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Safety & Security Active
            </div>

            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              Human WhatsApp formatting active. Single-asterisk bolding and natural conversational formatting are enabled.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}