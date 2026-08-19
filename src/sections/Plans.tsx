import { useState } from 'react';
import { Check, Crown, Sparkles, Loader2 } from 'lucide-react';
import { setPlan } from '@/lib/subscription';

interface PlansProps {
  onNavigate?: (id: any) => void;
}

export function Plans({ onNavigate }: PlansProps) {
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);

  const selectPlan = async (plan: 'monthly' | 'yearly') => {
    if (loading) return;

    setLoading(plan);

    try {
      const success = await setPlan(plan);

      if (!success) {
        alert('Please make sure you are logged in and try again.');
        return;
      }

      alert(
        plan === 'monthly'
          ? 'Premium Monthly selected. Payment will be available soon.'
          : 'Premium Yearly selected. Payment will be available soon.'
      );
    } catch (error) {
      console.error('Plan selection error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-3">
          <Crown size={24} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Choose your StudyMind plan
        </h1>

        <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">
          Start for free or unlock more powerful study tools with StudyMind Premium.
        </p>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">

        {/* FREE */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Free
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Get started with the essentials.
            </p>

            <div className="mt-5">
              <span className="text-3xl font-extrabold text-gray-900">
                TZS 0
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <Feature text="Dashboard" />
            <Feature text="Subjects" />
            <Feature text="Timetable" />
            <Feature text="Tasks" />
            <Feature text="Basic quizzes" />
            <Feature text="Basic progress tracking" />
          </div>

          <button
            type="button"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-700 py-3 font-semibold"
          >
            Free Plan
          </button>
        </div>

        {/* MONTHLY */}
        <div className="relative bg-white rounded-3xl border-2 border-brand-500 p-6 shadow-lg shadow-brand-500/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 text-white px-3 py-1 text-xs font-bold">
              <Sparkles size={12} />
              POPULAR
            </span>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Premium Monthly
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              More tools for serious studying.
            </p>

            <div className="mt-5">
              <span className="text-3xl font-extrabold text-gray-900">
                TZS 5,000
              </span>

              <span className="text-sm text-gray-500">
                /month
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <Feature text="Everything in Free" />
            <Feature text="Advanced revision tools" />
            <Feature text="More quizzes and practice" />
            <Feature text="Advanced progress tracking" />
            <Feature text="More AI study assistance" />
            <Feature text="More saved resources" />
          </div>

          <button
            type="button"
            onClick={() => selectPlan('monthly')}
            disabled={loading !== null}
            className="w-full rounded-xl bg-brand-500 text-white py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading === 'monthly' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              'Unlock Later — TZS 5,000/month'
            )}
          </button>
        </div>

        {/* YEARLY */}
        <div className="relative bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <div className="absolute -top-3 right-5">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 text-white px-3 py-1 text-xs font-bold">
              BEST VALUE
            </span>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Premium Yearly
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Save more with an annual plan.
            </p>

            <div className="mt-5">
              <span className="text-3xl font-extrabold text-gray-900">
                TZS 50,000
              </span>

              <span className="text-sm text-gray-500">
                /year
              </span>
            </div>

            <p className="text-xs text-green-600 font-semibold mt-1">
              Save TZS 10,000 per year
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <Feature text="Everything in Premium Monthly" />
            <Feature text="Advanced revision tools" />
            <Feature text="More quizzes and practice" />
            <Feature text="Advanced progress tracking" />
            <Feature text="More AI study assistance" />
            <Feature text="More saved resources" />
          </div>

          <button
            type="button"
            onClick={() => selectPlan('yearly')}
            disabled={loading !== null}
            className="w-full rounded-xl bg-gray-900 text-white py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading === 'yearly' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              'Unlock Later — TZS 50,000/year'
            )}
          </button>
        </div>

      </div>

      {/* Note */}
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs text-gray-400">
          Premium payments will be available soon. Free access remains available without payment.
        </p>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
        <Check size={12} />
      </div>

      <span>{text}</span>
    </div>
  );
}