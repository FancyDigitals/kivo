'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/config/brand';
import {
  Bot,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Building2,
  Loader2,
} from 'lucide-react';

export default function CreateBotWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    industry: 'business',
    name: '',
    businessName: '',
    description: '',
    capabilities: ['customer_support', 'sales_capture'],
    personality: 'professional',
    language: 'en',
    contactInfo: '',
    businessHours: 'Mon-Fri 8am - 6pm',
    seedKnowledge: '',
  });

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCapability = (capId) => {
    setFormData((prev) => {
      const exists = prev.capabilities.includes(capId);
      return {
        ...prev,
        capabilities: exists
          ? prev.capabilities.filter((c) => c !== capId)
          : [...prev.capabilities, capId],
      };
    });
  };

  const handleNext = () => {
    if (currentStep < 10) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.success && result.data?.id) {
        router.push(`/bots/${result.data.id}/test`);
      } else {
        alert(result.error || 'Failed to create bot. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating bot.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Wizard Header Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          <span>Step {currentStep} of 10</span>
          <span>{Math.round((currentStep / 10) * 100)}% Completed</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        {/* STEP 1: Industry / Category */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">What type of business are you building for?</h2>
              <p className="text-sm text-slate-500 mt-1">Select the category that best matches your organization.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BRAND.categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateField('industry', cat.id)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    formData.industry === cat.id
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Building2 className={`w-5 h-5 shrink-0 mt-0.5 ${formData.industry === cat.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{cat.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{cat.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Bot Name */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">What is your AI Assistant's name?</h2>
              <p className="text-sm text-slate-500 mt-1">This name will be used when introducing itself on WhatsApp.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bot Name</label>
              <input
                type="text"
                placeholder="e.g. Niola Assistant, Kivo Concierge, Sarah"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* STEP 3: Business Name */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">What is the official Business / Company name?</h2>
              <p className="text-sm text-slate-500 mt-1">The bot will represent this exact business name.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Name</label>
              <input
                type="text"
                placeholder="e.g. Niola Clothier Ltd, Apex Real Estate, Grand Bistro"
                value={formData.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* STEP 4: Business Description */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Describe what your business does</h2>
              <p className="text-sm text-slate-500 mt-1">Give a concise summary of products, services, or purpose.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Summary</label>
              <textarea
                rows={4}
                placeholder="e.g. We are a luxury African fashion brand in Lagos specializing in bespoke kaftans, agbada, and ready-to-wear tailored outfits with worldwide shipping."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* STEP 5: Capabilities */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">What should your AI employee do?</h2>
              <p className="text-sm text-slate-500 mt-1">Select all core capabilities you want enabled.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BRAND.capabilities.map((cap) => {
                const isSelected = formData.capabilities.includes(cap.id);
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => toggleCapability(cap.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-emerald-500 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{cap.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{cap.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: Personality */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Choose your bot's personality tone</h2>
              <p className="text-sm text-slate-500 mt-1">This sets how the AI communicates with customers.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BRAND.personalities.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => updateField('personality', p.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.personality === p.id
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="font-semibold text-sm text-slate-900">{p.label}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{p.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: Language */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Select primary conversation language</h2>
              <p className="text-sm text-slate-500 mt-1">The AI will default to this language on WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BRAND.languages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => updateField('language', lang.id)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                    formData.language === lang.id
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="font-semibold text-sm text-slate-900">{lang.label}</span>
                  <span className="text-xs text-slate-400 font-mono uppercase">{lang.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: Business Details */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Business operating details</h2>
              <p className="text-sm text-slate-500 mt-1">Help the bot answer questions about hours and location.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Operating Hours</label>
                <input
                  type="text"
                  placeholder="e.g. Mon-Fri 8:00 AM - 6:00 PM, Sat 10:00 AM - 4:00 PM"
                  value={formData.businessHours}
                  onChange={(e) => updateField('businessHours', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address or Phone Contact</label>
                <input
                  type="text"
                  placeholder="e.g. 14 Victoria Island, Lagos / +234 800 000 0000"
                  value={formData.contactInfo}
                  onChange={(e) => updateField('contactInfo', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: Seed Knowledge */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Initial Knowledge & FAQs</h2>
              <p className="text-sm text-slate-500 mt-1">Paste key pricing, return policies, or FAQs (optional).</p>
            </div>

            <div>
              <textarea
                rows={5}
                placeholder="e.g. Black Kaftan: ₦45,000. Agbada Set: ₦120,000. Delivery takes 3-5 business days. Returns accepted within 7 days."
                value={formData.seedKnowledge}
                onChange={(e) => updateField('seedKnowledge', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* STEP 10: Generate Review */}
        {currentStep === 10 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Ready to build {formData.name || 'your Bot'}!</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Kivo AI Gateway will now generate the system directives, security boundaries, and welcome messages.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto text-slate-700">
              <div className="flex justify-between"><span className="text-slate-500">Business:</span> <span className="font-semibold">{formData.businessName || 'Niola Clothier'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Personality:</span> <span className="font-semibold uppercase">{formData.personality}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Language:</span> <span className="font-semibold">{formData.language}</span></div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              currentStep === 1 || isSubmitting
                ? 'opacity-30 cursor-not-allowed text-slate-400'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep < 10 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={
                (currentStep === 2 && !formData.name) ||
                (currentStep === 3 && !formData.businessName)
              }
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating AI Agent...
                </>
              ) : (
                <>
                  Generate Bot & Launch Simulator
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}