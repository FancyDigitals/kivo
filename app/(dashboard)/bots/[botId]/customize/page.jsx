'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Sliders,
  Sparkles,
  Cpu,
  Shield,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Smartphone,
  ExternalLink,
  Building2,
  Brain,
  BookOpen,
  Settings2,
  Clock3,
  Target,
  Ban,
  UserRound,
} from 'lucide-react';

import { BRAND } from '@/config/brand';

export default function CustomizeBotPage({ params }) {
  const unwrappedParams = use(params);
  const botId = unwrappedParams.botId;

  const [activeTab, setActiveTab] = useState('identity');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    mode: 'business',

    // Identity
    name: '',
    businessName: '',
    personName: '',
    industry: 'business',
    description: '',

    // Bot behavior
    capabilities: ['customer_support', 'sales_capture'],
    personality: 'professional',
    language: 'en',

    // Business information
    contactInfo: '',
    businessHours: 'Mon-Fri 8am - 6pm',

    // Knowledge
    seedKnowledge: '',
    personalBackground: '',
    personalKnowledge: '',
    communicationStyle: '',
    communicationExamples: '',
    personalBoundaries: '',

    // WhatsApp
    whatsappNumber: '',
    phoneNumberId: '',

    // AI
    primaryProvider: 'groq',
    primaryModel: 'llama-3.1-8b-instant',
    fallbackProvider: 'gemini',
    fallbackModel: 'gemini-2.0-flash',
    temperature: '0.3',

    // Messages
    welcomeMessage: '',
    fallbackMessage: '',

    // Rules
    objectives: [],
    rules: [],
    restrictions: [],
    handoffKeywords: [],

    // Advanced behavior
    responseLength: 'balanced',
    useEmojis: false,
    rememberConversation: true,
    askBeforeHandoff: false,
    allowHumanHandoff: true,
    businessHoursOnly: false,
    confidenceThreshold: '0.7',
  });

  const [newObjective, setNewObjective] = useState('');
  const [newRule, setNewRule] = useState('');
  const [newRestriction, setNewRestriction] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  const isPersonal = formData.mode === 'personal';

  useEffect(() => {
    async function loadBot() {
      try {
        const res = await fetch(`/api/bots/${botId}`);
        const data = await res.json();

        if (data.success && data.data) {
          setFormData((prev) => ({
            ...prev,
            ...data.data,

            whatsappNumber:
              data.data.whatsappNumber ||
              data.data.phoneNumber ||
              prev.whatsappNumber,

            capabilities:
              Array.isArray(data.data.capabilities)
                ? data.data.capabilities
                : prev.capabilities,

            objectives:
              Array.isArray(data.data.objectives)
                ? data.data.objectives
                : prev.objectives,

            rules:
              Array.isArray(data.data.rules)
                ? data.data.rules
                : prev.rules,

            restrictions:
              Array.isArray(data.data.restrictions)
                ? data.data.restrictions
                : prev.restrictions,

            handoffKeywords:
              Array.isArray(data.data.handoffKeywords)
                ? data.data.handoffKeywords
                : prev.handoffKeywords,
          }));
        }
      } catch (error) {
        console.error('Failed to load bot:', error);
      } finally {
        setLoading(false);
      }
    }

    loadBot();
  }, [botId]);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addItem = (field, value, setter) => {
    const cleanValue = value.trim();

    if (!cleanValue) return;

    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), cleanValue],
    }));

    setter('');
  };

  const removeItem = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  };

  const toggleCapability = (capabilityId) => {
    setFormData((prev) => {
      const exists = (prev.capabilities || []).includes(capabilityId);

      return {
        ...prev,
        capabilities: exists
          ? prev.capabilities.filter((item) => item !== capabilityId)
          : [...(prev.capabilities || []), capabilityId],
      };
    });
  };

  const handleSave = async (e) => {
    e?.preventDefault();

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.success) {
        setSaveSuccess(true);

        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        alert(result.error || 'Failed to update bot.');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating bot settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const cleanPhone = (formData.whatsappNumber || '').replace(
    /[^0-9]/g,
    ''
  );

  const testChatUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        'Hello! Testing the bot.'
      )}`
    : '#';

  const tabs = [
    {
      id: 'identity',
      label: 'Identity',
      icon: UserRound,
    },
    {
      id: 'behavior',
      label: 'Behavior',
      icon: Sliders,
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      icon: BookOpen,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: Smartphone,
    },
    {
      id: 'ai',
      label: 'AI Engine',
      icon: Cpu,
    },
    {
      id: 'rules',
      label: 'Rules & Safety',
      icon: Shield,
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: Settings2,
    },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-1 sm:px-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="text-sm font-medium text-slate-500 mt-4">
            Loading bot configuration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-1 sm:px-0 pb-12">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/bots"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Customize {formData.name || 'Bot'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Configure the deeper identity, knowledge, behavior, AI engine,
              WhatsApp connection, rules and safety controls for this bot.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Changes Saved
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />

            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* CONFIGURATION NOTICE */}

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              Advanced bot customization
            </p>

            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Your bot was created with the essential setup. You can now
              customize its deeper behavior, knowledge, personality, rules,
              AI configuration and communication settings here.
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="border-b border-slate-200 overflow-x-auto">
          <div className="flex min-w-max px-2 sm:px-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 sm:px-4 py-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                    active
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-6">

          {/* =====================================================
              IDENTITY
          ===================================================== */}

          {activeTab === 'identity' && (
            <Section
              icon={UserRound}
              title="Bot Identity"
              description="Define exactly who this AI represents and the context it should operate within."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <Field
                  label="Bot Name"
                  value={formData.name}
                  onChange={(value) => updateField('name', value)}
                  placeholder="e.g. Kivo Concierge"
                />

                <Field
                  label="Business / Organization"
                  value={formData.businessName}
                  onChange={(value) =>
                    updateField('businessName', value)
                  }
                  placeholder="e.g. Fancy Digitals"
                />

                {isPersonal && (
                  <Field
                    label="Person's Name"
                    value={formData.personName}
                    onChange={(value) =>
                      updateField('personName', value)
                    }
                    placeholder="e.g. Fancy"
                  />
                )}

                {!isPersonal && (
                  <Field
                    label="Industry"
                    value={formData.industry}
                    onChange={(value) =>
                      updateField('industry', value)
                    }
                    placeholder="e.g. Technology, Fashion, Legal"
                  />
                )}

                <div className="sm:col-span-2">
                  <TextArea
                    label={
                      isPersonal
                        ? 'Personal Background'
                        : 'Business Description'
                    }
                    rows={7}
                    value={
                      isPersonal
                        ? formData.personalBackground
                        : formData.description
                    }
                    onChange={(value) =>
                      updateField(
                        isPersonal
                          ? 'personalBackground'
                          : 'description',
                        value
                      )
                    }
                    placeholder={
                      isPersonal
                        ? `Who is this person?
What do they do?
What are they known for?
What do they work on?
What should people know about them?`
                        : `Describe the business, products, services, audience, location, expertise and anything else the AI should understand about the organization.`
                    }
                  />
                </div>

                {!isPersonal && (
                  <>
                    <Field
                      label="Business Hours"
                      value={formData.businessHours}
                      onChange={(value) =>
                        updateField('businessHours', value)
                      }
                      placeholder="Mon-Fri 8am - 6pm"
                    />

                    <Field
                      label="Address / Contact Information"
                      value={formData.contactInfo}
                      onChange={(value) =>
                        updateField('contactInfo', value)
                      }
                      placeholder="Lagos, Nigeria / +234..."
                    />
                  </>
                )}
              </div>
            </Section>
          )}

          {/* =====================================================
              BEHAVIOR
          ===================================================== */}

          {activeTab === 'behavior' && (
            <div className="space-y-8">

              <Section
                icon={Sliders}
                title="Conversation Behavior"
                description="Control how your bot communicates and what it is capable of doing."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <SelectField
                    label="Personality"
                    value={formData.personality}
                    onChange={(value) =>
                      updateField('personality', value)
                    }
                    options={BRAND.personalities.map((item) => ({
                      value: item.id,
                      label: item.label,
                    }))}
                  />

                  <SelectField
                    label="Primary Language"
                    value={formData.language}
                    onChange={(value) =>
                      updateField('language', value)
                    }
                    options={BRAND.languages.map((item) => ({
                      value: item.id,
                      label: item.label,
                    }))}
                  />

                  <SelectField
                    label="Response Length"
                    value={formData.responseLength}
                    onChange={(value) =>
                      updateField('responseLength', value)
                    }
                    options={[
                      {
                        value: 'short',
                        label: 'Short and concise',
                      },
                      {
                        value: 'balanced',
                        label: 'Balanced',
                      },
                      {
                        value: 'detailed',
                        label: 'Detailed',
                      },
                    ]}
                  />

                  <Toggle
                    label="Use Emojis"
                    description="Allow the AI to naturally use emojis in conversations."
                    checked={formData.useEmojis}
                    onChange={(value) =>
                      updateField('useEmojis', value)
                    }
                  />
                </div>
              </Section>

              {!isPersonal && (
                <Section
                  icon={Target}
                  title="Bot Capabilities"
                  description="Choose the functions this AI employee should be allowed to perform."
                >
                  <CapabilityGrid
                    capabilities={BRAND.capabilities}
                    selected={formData.capabilities || []}
                    onToggle={toggleCapability}
                  />
                </Section>
              )}

              {isPersonal && (
                <Section
                  icon={MessageSquare}
                  title="Personal Communication Style"
                  description="Give Kivo the information needed to communicate like this person."
                >
                  <div className="space-y-5">
                    <TextArea
                      label="Communication Style"
                      rows={7}
                      value={formData.communicationStyle}
                      onChange={(value) =>
                        updateField(
                          'communicationStyle',
                          value
                        )
                      }
                      placeholder={`I keep messages short.
I speak casually.
I get straight to the point.
I sometimes use Nigerian English.
I don't like sounding too formal.`}
                    />

                    <TextArea
                      label="Real Message Examples"
                      rows={8}
                      value={formData.communicationExamples}
                      onChange={(value) =>
                        updateField(
                          'communicationExamples',
                          value
                        )
                      }
                      placeholder={`"Abeg send me the details."
"Yeah I get you."
"Let's sort it tomorrow."
"Honestly I don't think that's necessary."
"Send me your location."`}
                    />
                  </div>
                </Section>
              )}

              <Section
                icon={MessageSquare}
                title="Messages"
                description="Customize what the bot says when conversations begin or require human assistance."
              >
                <div className="space-y-5">
                  <TextArea
                    label="Welcome Message"
                    rows={4}
                    value={formData.welcomeMessage}
                    onChange={(value) =>
                      updateField('welcomeMessage', value)
                    }
                    placeholder="Write the first message customers receive..."
                  />

                  <TextArea
                    label="Human Handoff / Fallback Message"
                    rows={4}
                    value={formData.fallbackMessage}
                    onChange={(value) =>
                      updateField('fallbackMessage', value)
                    }
                    placeholder="Write the message used when the AI cannot confidently handle a request..."
                  />
                </div>
              </Section>
            </div>
          )}

          {/* =====================================================
              KNOWLEDGE
          ===================================================== */}

          {activeTab === 'knowledge' && (
            <Section
              icon={BookOpen}
              title="Bot Knowledge"
              description="This is where you give the bot the deeper information it should use when answering users."
            >
              <div className="space-y-6">

                {!isPersonal && (
                  <TextArea
                    label="Business Knowledge & FAQs"
                    rows={12}
                    value={formData.seedKnowledge}
                    onChange={(value) =>
                      updateField('seedKnowledge', value)
                    }
                    placeholder={`Products and services
Pricing
Frequently asked questions
Delivery information
Return policies
Opening hours
Locations
Payment information
Contact details
Important company policies
Common customer questions

Add verified information here. The AI should rely on this information instead of inventing answers.`}
                  />
                )}

                {isPersonal && (
                  <>
                    <TextArea
                      label="Personal Knowledge"
                      rows={12}
                      value={formData.personalKnowledge}
                      onChange={(value) =>
                        updateField(
                          'personalKnowledge',
                          value
                        )
                      }
                      placeholder={`Current projects
Professional background
Services
Skills
Preferences
Availability
Frequently asked questions
Important facts
Common answers
Things people usually ask about`}
                    />

                    <TextArea
                      label="Personal Boundaries"
                      rows={9}
                      value={formData.personalBoundaries}
                      onChange={(value) =>
                        updateField(
                          'personalBoundaries',
                          value
                        )
                      }
                      placeholder={`Never make financial commitments for me.
Never invent my opinions.
Never share private information.
Never claim I personally typed the message.
Never agree to meetings without checking with me.`}
                    />
                  </>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <Brain className="w-5 h-5 text-emerald-600 shrink-0" />

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Knowledge accuracy
                      </p>

                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Only provide information you have supplied or
                        information the bot is explicitly allowed to infer.
                        Do not use this field for sensitive credentials,
                        API keys or passwords.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* =====================================================
              WHATSAPP
          ===================================================== */}

          {activeTab === 'whatsapp' && (
            <Section
              icon={Smartphone}
              title="WhatsApp Connection"
              description="Configure the WhatsApp number associated with this bot."
            >
              <div className="space-y-6">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <Field
                    label="WhatsApp Phone Number"
                    value={formData.whatsappNumber || ''}
                    onChange={(value) =>
                      updateField('whatsappNumber', value)
                    }
                    placeholder="+234 812 345 6789"
                    mono
                  />

                  <Field
                    label="Meta Phone Number ID"
                    value={formData.phoneNumberId || ''}
                    onChange={(value) =>
                      updateField('phoneNumberId', value)
                    }
                    placeholder="109283746592812"
                    mono
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">
                        Direct WhatsApp Chat
                      </p>

                      <p className="text-xs font-mono text-emerald-700 truncate mt-1">
                        {cleanPhone
                          ? `https://wa.me/${cleanPhone}`
                          : 'Enter a WhatsApp number above'}
                      </p>
                    </div>

                    {cleanPhone && (
                      <a
                        href={testChatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        Test WhatsApp
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href={`/bots/${botId}/whatsapp`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Open Full WhatsApp Setup & QR Page
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </Link>
                </div>
              </div>
            </Section>
          )}

          {/* =====================================================
              AI ENGINE
          ===================================================== */}

          {activeTab === 'ai' && (
            <Section
              icon={Cpu}
              title="AI Gateway & Models"
              description="Control the model providers, fallback behavior and generation temperature."
            >
              <div className="space-y-6">

                <div className="p-4 rounded-xl bg-slate-900 text-white">
                  <div className="flex items-start gap-3">
                    <Cpu className="w-5 h-5 text-emerald-400 shrink-0" />

                    <div>
                      <p className="text-sm font-bold text-emerald-400">
                        Multi-Provider AI Gateway
                      </p>

                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        The primary provider is attempted first. If it is
                        unavailable or rate-limited, the configured fallback
                        provider can take over.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  <SelectField
                    label="Primary Provider"
                    value={formData.primaryProvider}
                    onChange={(value) =>
                      updateField(
                        'primaryProvider',
                        value
                      )
                    }
                    options={[
                      {
                        value: 'groq',
                        label: 'Groq',
                      },
                      {
                        value: 'gemini',
                        label: 'Google Gemini',
                      },
                      {
                        value: 'openrouter',
                        label: 'OpenRouter',
                      },
                    ]}
                  />

                  <SelectField
                    label="Primary Model"
                    value={formData.primaryModel}
                    onChange={(value) =>
                      updateField(
                        'primaryModel',
                        value
                      )
                    }
                    options={[
                      {
                        value: 'llama-3.1-8b-instant',
                        label: 'Llama 3.1 8B Instant',
                      },
                      {
                        value: 'llama-3.3-70b-versatile',
                        label: 'Llama 3.3 70B',
                      },
                      {
                        value: 'gemini-2.0-flash',
                        label: 'Gemini 2.0 Flash',
                      },
                    ]}
                  />

                  <SelectField
                    label="Fallback Provider"
                    value={formData.fallbackProvider}
                    onChange={(value) =>
                      updateField(
                        'fallbackProvider',
                        value
                      )
                    }
                    options={[
                      {
                        value: 'gemini',
                        label: 'Google Gemini',
                      },
                      {
                        value: 'groq',
                        label: 'Groq',
                      },
                      {
                        value: 'openrouter',
                        label: 'OpenRouter',
                      },
                    ]}
                  />

                  <SelectField
                    label="Fallback Model"
                    value={formData.fallbackModel}
                    onChange={(value) =>
                      updateField(
                        'fallbackModel',
                        value
                      )
                    }
                    options={[
                      {
                        value: 'gemini-2.0-flash',
                        label: 'Gemini 2.0 Flash',
                      },
                      {
                        value: 'llama-3.1-8b-instant',
                        label: 'Llama 3.1 8B Instant',
                      },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Temperature
                  </label>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) =>
                      updateField(
                        'temperature',
                        e.target.value
                      )
                    }
                    className="w-full accent-emerald-500"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                    <span>0.0 Precise</span>
                    <span>
                      Current: {formData.temperature}
                    </span>
                    <span>1.0 Creative</span>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* =====================================================
              RULES
          ===================================================== */}

          {activeTab === 'rules' && (
            <div className="space-y-6">

              <ListEditor
                icon={Target}
                title="Bot Objectives"
                description="What should this bot accomplish during conversations?"
                items={formData.objectives || []}
                value={newObjective}
                setValue={setNewObjective}
                placeholder="e.g. Qualify leads before human handoff"
                onAdd={() =>
                  addItem(
                    'objectives',
                    newObjective,
                    setNewObjective
                  )
                }
                onRemove={(index) =>
                  removeItem('objectives', index)
                }
              />

              <ListEditor
                icon={MessageSquare}
                title="Conversation Guidelines"
                description="Instructions that should influence every conversation."
                items={formData.rules || []}
                value={newRule}
                setValue={setNewRule}
                placeholder="e.g. Keep answers concise and professional"
                onAdd={() =>
                  addItem(
                    'rules',
                    newRule,
                    setNewRule
                  )
                }
                onRemove={(index) =>
                  removeItem('rules', index)
                }
              />

              <ListEditor
                icon={Ban}
                title="Restrictions"
                description="Things the bot must never do or claim."
                items={formData.restrictions || []}
                value={newRestriction}
                setValue={setNewRestriction}
                placeholder="e.g. Never invent pricing"
                onAdd={() =>
                  addItem(
                    'restrictions',
                    newRestriction,
                    setNewRestriction
                  )
                }
                onRemove={(index) =>
                  removeItem('restrictions', index)
                }
              />

              <ListEditor
                icon={Phone}
                title="Human Handoff Keywords"
                description="Words that can indicate the user wants to speak with a human."
                items={formData.handoffKeywords || []}
                value={newKeyword}
                setValue={setNewKeyword}
                placeholder="e.g. manager"
                onAdd={() =>
                  addItem(
                    'handoffKeywords',
                    newKeyword,
                    setNewKeyword
                  )
                }
                onRemove={(index) =>
                  removeItem(
                    'handoffKeywords',
                    index
                  )
                }
              />
            </div>
          )}

          {/* =====================================================
              ADVANCED
          ===================================================== */}

          {activeTab === 'advanced' && (
            <Section
              icon={Settings2}
              title="Advanced Behavior"
              description="Fine-tune how the bot handles memory, handoffs, operating hours and uncertain answers."
            >
              <div className="space-y-5">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <SelectField
                    label="Confidence Threshold"
                    value={formData.confidenceThreshold}
                    onChange={(value) =>
                      updateField(
                        'confidenceThreshold',
                        value
                      )
                    }
                    options={[
                      {
                        value: '0.5',
                        label: '0.50 Low',
                      },
                      {
                        value: '0.6',
                        label: '0.60 Moderate',
                      },
                      {
                        value: '0.7',
                        label: '0.70 Balanced',
                      },
                      {
                        value: '0.8',
                        label: '0.80 High',
                      },
                      {
                        value: '0.9',
                        label: '0.90 Very High',
                      },
                    ]}
                  />

                  <Toggle
                    label="Conversation Memory"
                    description="Allow the bot to use available conversation context."
                    checked={formData.rememberConversation}
                    onChange={(value) =>
                      updateField(
                        'rememberConversation',
                        value
                      )
                    }
                  />

                  <Toggle
                    label="Human Handoff"
                    description="Allow the bot to escalate conversations to a human."
                    checked={formData.allowHumanHandoff}
                    onChange={(value) =>
                      updateField(
                        'allowHumanHandoff',
                        value
                      )
                    }
                  />

                  <Toggle
                    label="Ask Before Handoff"
                    description="Ask the user before transferring the conversation."
                    checked={formData.askBeforeHandoff}
                    onChange={(value) =>
                      updateField(
                        'askBeforeHandoff',
                        value
                      )
                    }
                  />

                  <Toggle
                    label="Business Hours Only"
                    description="Restrict automated behavior to configured operating hours."
                    checked={formData.businessHoursOnly}
                    onChange={(value) =>
                      updateField(
                        'businessHoursOnly',
                        value
                      )
                    }
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <Clock3 className="w-5 h-5 text-slate-500 shrink-0" />

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Operating hours
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {formData.businessHours ||
                          'No operating hours configured.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-amber-600 shrink-0" />

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Advanced settings affect bot behavior
                      </p>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Change these settings only when you understand how
                        they affect responses, memory and human escalation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* BOTTOM SAVE */}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   SECTION
================================================================ */

function Section({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

/* ================================================================
   FIELD
================================================================ */

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">
        {label}
      </label>

      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
          mono ? 'font-mono' : ''
        }`}
      />
    </div>
  );
}

/* ================================================================
   TEXT AREA
================================================================ */

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      <textarea
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-y"
      />
    </div>
  );
}

/* ================================================================
   SELECT
================================================================ */

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">
        {label}
      </label>

      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ================================================================
   TOGGLE
================================================================ */

function Toggle({
  label,
  description,
  checked,
  onChange,
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        checked
          ? 'border-emerald-500 bg-emerald-50/50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {label}
          </p>

          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {description}
          </p>
        </div>

        <div
          className={`w-10 h-6 rounded-full p-1 shrink-0 transition-colors ${
            checked
              ? 'bg-emerald-500'
              : 'bg-slate-300'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
              checked
                ? 'translate-x-4'
                : 'translate-x-0'
            }`}
          />
        </div>
      </div>
    </button>
  );
}

/* ================================================================
   CAPABILITIES
================================================================ */

function CapabilityGrid({
  capabilities,
  selected,
  onToggle,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {capabilities.map((capability) => {
        const selectedState =
          selected.includes(capability.id);

        return (
          <button
            key={capability.id}
            type="button"
            onClick={() =>
              onToggle(capability.id)
            }
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedState
                ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                  selectedState
                    ? 'bg-emerald-500 text-white'
                    : 'border border-slate-300'
                }`}
              >
                {selectedState && (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  {capability.label}
                </p>

                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {capability.desc}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================
   LIST EDITOR
================================================================ */

function ListEditor({
  icon: Icon,
  title,
  description,
  items,
  value,
  setValue,
  placeholder,
  onAdd,
  onRemove,
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {title}
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
          >
            <span className="text-xs text-slate-700 leading-relaxed">
              {item}
            </span>

            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-slate-400 hover:text-red-500 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center">
            <p className="text-xs text-slate-400">
              Nothing configured yet.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) =>
            setValue(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <button
          type="button"
          onClick={onAdd}
          className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
    </section>
  );
}