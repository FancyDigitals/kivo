'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/config/brand';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  UserRound,
  Loader2,
} from 'lucide-react';

export default function CreateBotWizardPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    mode: 'business',
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
    personName: '',
    personalBackground: '',
    communicationStyle: '',
    communicationExamples: '',
    personalKnowledge: '',
    personalBoundaries: '',
  });

  const isPersonal = formData.mode === 'personal';

  /*
   * IMPORTANT:
   * Bot creation is intentionally lightweight.
   *
   * Advanced customization is NOT collected here.
   * Users are informed about advanced customization after
   * the bot has been created and they arrive at the test page.
   */
  const totalSteps = 4;

  const updateField = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const canContinue = () => {
    if (currentStep === 1) return true;

    if (currentStep === 2) {
      return Boolean(formData.name.trim());
    }

    if (currentStep === 3) {
      return isPersonal
        ? Boolean(formData.personName.trim())
        : Boolean(formData.businessName.trim());
    }

    return true;
  };

  const handleNext = () => {
    if (!canContinue()) return;

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && !isSubmitting) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canContinue() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,

        industry: isPersonal ? 'personal' : formData.industry,

        businessName: isPersonal
          ? formData.personName.trim()
          : formData.businessName.trim(),

        /*
         * Keep the payload compatible with the existing API.
         * Empty advanced fields are intentionally passed through.
         * Advanced customization happens after creation.
         */
        description: isPersonal
          ? `PERSONAL VIRTUAL VERSION OF: ${formData.personName.trim()}`
          : formData.description.trim(),

        seedKnowledge: formData.seedKnowledge.trim(),
      };

      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success && result.data?.id) {
        router.push(`/bots/${result.data.id}/test`);
        return;
      }

      alert(result.error || 'Failed to create bot. Please try again.');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Create bot error:', error);
      alert('Error creating bot.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-2 py-4 sm:py-8">
      {/* PROGRESS */}
      <div className="mb-6 sm:mb-8 px-1">
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          <span>
            Step {currentStep} of {totalSteps}
          </span>

          <span>
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>

        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out rounded-full"
            style={{
              width: `${(currentStep / totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-8">
        {/* =====================================================
            STEP 1
        ===================================================== */}

        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                Who is this KIVOO being created for?
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Choose what your Kivo should represent.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField('mode', 'business')}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  !isPersonal
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Building2
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    !isPersonal
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                />

                <div>
                  <p className="font-bold text-sm text-slate-900">
                    Business
                  </p>

                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    Create an AI employee for a company, brand,
                    organization or service.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateField('mode', 'personal')}
                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isPersonal
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <UserRound
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isPersonal
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                />

                <div>
                  <p className="font-bold text-sm text-slate-900">
                    Me / A Person
                  </p>

                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    Create a virtual version of a real person.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* =====================================================
            STEP 2
        ===================================================== */}

        {currentStep === 2 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                What should your Kivo be called?
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                This is the name people will see when interacting with it.
              </p>
            </div>

            <Field
              label="KIVOO BOT NAME"
              placeholder={
                isPersonal
                  ? "e.g. Fancy AI, Sarah's Assistant"
                  : 'e.g. Kivo Concierge, Niola Assistant'
              }
              value={formData.name}
              onChange={(value) => updateField('name', value)}
              autoFocus
            />
          </div>
        )}

        {/* =====================================================
            STEP 3
        ===================================================== */}

        {currentStep === 3 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                {isPersonal
                  ? 'Who is this virtual version of?'
                  : 'What is the official business name?'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {isPersonal
                  ? 'Tell Kivo who the virtual version represents.'
                  : 'This is the business your Kivo will represent.'}
              </p>
            </div>

            {isPersonal ? (
              <Field
                label="PERSON'S NAME"
                placeholder="e.g. Fancy"
                value={formData.personName}
                onChange={(value) =>
                  updateField('personName', value)
                }
                autoFocus
              />
            ) : (
              <Field
                label="BUSINESS NAME"
                placeholder="e.g. Niola Clothier Ltd"
                value={formData.businessName}
                onChange={(value) =>
                  updateField('businessName', value)
                }
                autoFocus
              />
            )}
          </div>
        )}

        {/* =====================================================
            STEP 4
        ===================================================== */}

        {currentStep === 4 && (
          <div className="space-y-5 sm:space-y-6">
            <div className="text-center py-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                {isPersonal ? (
                  <UserRound className="w-7 h-7 sm:w-8 sm:h-8" />
                ) : (
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
                )}
              </div>

              <h2 className="mt-4 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {isPersonal
                  ? `Ready to create ${formData.name || 'your Kivo'}`
                  : `Ready to build ${formData.name || 'your Kivo'}`}
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Your Kivo will be created with the essential setup.
                You can customize its personality, knowledge,
                capabilities and behavior after creation.
              </p>
            </div>

            {/* SIMPLE REVIEW */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2.5">
              <ReviewRow
                label="Type"
                value={isPersonal ? 'Personal AI' : 'Business AI'}
              />

              <ReviewRow
                label={isPersonal ? 'Person' : 'Business'}
                value={
                  isPersonal
                    ? formData.personName || 'Not provided'
                    : formData.businessName || 'Not provided'
                }
              />

              <ReviewRow
                label="AI Name"
                value={formData.name || 'Not provided'}
              />

              <ReviewRow
                label="Language"
                value={formData.language}
                last
              />
            </div>

            {/* ADVANCED CUSTOMIZATION NOTICE */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Advanced customization is available
                  </p>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Once your Kivo is created, you can test it immediately
                    and access advanced customization options to fine-tune
                    its personality, knowledge, capabilities, behavior,
                    instructions and more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTROLS */}

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
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canContinue()}
              className="h-11 px-5 sm:px-6 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-40 disabled:pointer-events-none text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all select-none"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <span className="hidden xs:inline">
                    {isPersonal
                      ? 'Create Virtual Version'
                      : 'Create Kivo'}
                  </span>

                  <span className="xs:hidden">
                    {isPersonal ? 'Create' : 'Create'}
                  </span>

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

/* ================================================================
   FIELD
================================================================ */

function Field({
  label,
  placeholder,
  value,
  onChange,
  autoFocus = false,
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
        {label}
      </label>

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
      />
    </div>
  );
}

/* ================================================================
   REVIEW ROW
================================================================ */

function ReviewRow({
  label,
  value,
  last = false,
}) {
  return (
    <div
      className={`flex justify-between items-center gap-4 ${
        !last
          ? 'pb-1.5 border-b border-slate-200/60'
          : ''
      }`}
    >
      <span className="text-slate-500 font-medium shrink-0">
        {label}
      </span>

      <span className="font-bold text-slate-900 truncate text-right">
        {value}
      </span>
    </div>
  );
}
