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
    <div className="max-w-2xl mx-auto px-2 py-4 sm:py-8">
      {/* ---------- HEADER PROGRESS BAR ---------- */}
      <div className="mb-6 sm:mb-8 px-1">
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          <span>Step {currentStep} of 10</span>
          <span>{Math.round((currentStep / 10) * 100)}% Complete</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* ---------- CARD WRAPPER ---------- */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-8">
        
        {/* STEP 1: Industry / Category */}
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                What type of business are you building for?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select the category that best matches your organization.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto sm:max-h-none pr-1">
              {BRAND.categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateField('industry', cat.id)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 min-h-[72px] sm:min-h-0 active:scale-[0.98] sm:active:scale-100 ${
                    formData.industry === cat.id
                      ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Building2 className={`w-5 h-5 shrink-0 mt-0.5 ${formData.industry === cat.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-slate-900 truncate">{cat.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{cat.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Bot Name */}
        {currentStep === 2 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                What is your AI Assistant's name?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                This name will be used when introducing itself on WhatsApp.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                Bot Name
              </label>
              <input
                type="text"
                placeholder="e.g. Niola Assistant, Kivo Concierge, Sarah"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* STEP 3: Business Name */}
        {currentStep === 3 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                What is the official Business / Company name?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                The bot will represent this exact business name.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                Business Name
              </label>
              <input
                type="text"
                placeholder="e.g. Niola Clothier Ltd, Apex Real Estate, Grand Bistro"
                value={formData.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* STEP 4: Business Description */}
        {currentStep === 4 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                Describe what your business does
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Give a concise summary of products, services, or purpose.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                Business Summary
              </label>
              <textarea
                rows={4}
                placeholder="e.g. We are a luxury African fashion brand in Lagos specializing in bespoke kaftans, agbada, and ready-to-wear tailored outfits with worldwide shipping."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 5: Capabilities */}
        {currentStep === 5 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                What should your AI employee do?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select all core capabilities you want enabled.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto sm:max-h-none pr-1">
              {BRAND.capabilities.map((cap) => {
                const isSelected = formData.capabilities.includes(cap.id);
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => toggleCapability(cap.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 min-h-[72px] sm:min-h-0 active:scale-[0.98] sm:active:scale-100 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isSelected ? 'bg-emerald-500 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900 truncate">{cap.label}</p>
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
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                Choose your bot's personality tone
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                This sets how the AI communicates with customers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto sm:max-h-none pr-1">
              {BRAND.personalities.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => updateField('personality', p.id)}
                  className={`p-4 rounded-xl border text-left transition-all active:scale-[0.98] sm:active:scale-100 ${
                    formData.personality === p.id
                      ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="font-bold text-sm text-slate-900">{p.label}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{p.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: Language */}
        {currentStep === 7 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                Select primary conversation language
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                The AI will default to this language on WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto sm:max-h-none pr-1">
              {BRAND.languages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => updateField('language', lang.id)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between active:scale-[0.98] sm:active:scale-100 ${
                    formData.language === lang.id
                      ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="font-bold text-sm text-slate-900">{lang.label}</span>
                  <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">{lang.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: Business Details */}
        {currentStep === 8 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                Business operating details
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Help the bot answer questions about hours and location.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">Operating Hours</label>
                <input
                  type="text"
                  placeholder="e.g. Mon-Fri 8:00 AM - 6:00 PM, Sat 10:00 AM - 4:00 PM"
                  value={formData.businessHours}
                  onChange={(e) => updateField('businessHours', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">Address or Phone Contact</label>
                <input
                  type="text"
                  placeholder="e.g. 14 Victoria Island, Lagos / +234 800 000 0000"
                  value={formData.contactInfo}
                  onChange={(e) => updateField('contactInfo', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: Seed Knowledge */}
        {currentStep === 9 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                Initial Knowledge & FAQs
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Paste key pricing, return policies, or FAQs (optional).
              </p>
            </div>

            <div className="space-y-1.5">
              <textarea
                rows={5}
                placeholder="e.g. Black Kaftan: ₦45,000. Agbada Set: ₦120,000. Delivery takes 3-5 business days. Returns accepted within 7 days."
                value={formData.seedKnowledge}
                onChange={(e) => updateField('seedKnowledge', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 10: Generate Review */}
        {currentStep === 10 && (
          <div className="space-y-5 text-center py-2 sm:py-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Ready to build {formData.name || 'your Bot'}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Our AI Gateway will now generate the system directives, security boundaries, and welcome messages.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2.5 max-w-sm mx-auto text-slate-700">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Business:</span> 
                <span className="font-bold text-slate-900 truncate pl-4">{formData.businessName || 'Niola Clothier'}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Personality:</span> 
                <span className="font-bold text-slate-900 uppercase">{formData.personality}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Language:</span> 
                <span className="font-bold text-slate-900 uppercase">{formData.language}</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------- WIZARD CONTROLS ---------- */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className={`h-11 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all select-none ${
              currentStep === 1 || isSubmitting
                ? 'opacity-30 cursor-not-allowed text-slate-400'
                : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
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
              className="h-11 px-5 sm:px-6 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-40 disabled:pointer-events-none text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all select-none"
            >
              Continue
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-11 px-5 sm:px-7 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 transition-all select-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  Generating...
                </>
              ) : (
                <>
                  <span className="hidden xs:inline">Generate & Launch</span>
                  <span className="xs:hidden">Launch Bot</span>
                  <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}