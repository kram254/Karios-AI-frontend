import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckIcon, Loader2Icon } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  limits: {
    research_queries: number;
    automation_runs: number;
    api_calls: number;
    team_members: number;
  };
  popular?: boolean;
  recommended_for: string;
}

interface PricingData {
  tiers: PricingTier[];
  currency: string;
  billing_cycles: string[];
  annual_discount_pct: number;
}

const Pricing: React.FC = () => {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await axios.get('/api/billing/pricing');
      setPricingData(response.data);
    } catch (err) {
      console.error('Failed to fetch pricing:', err);
      setError('Failed to load pricing. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    if (tierId === 'free') {
      window.location.href = '/chat';
      return;
    }

    setCheckoutLoading(tierId);
    setError(null);
    try {
      const response = await axios.post('/api/billing/checkout', {
        tier: tierId,
        annual: billingCycle === 'annual',
      });
      // Redirect to Stripe-hosted checkout page
      window.location.href = response.data.checkout_url;
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        'Checkout failed. Please try again or contact support.';
      setError(message);
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await axios.post('/api/billing/portal');
      window.location.href = response.data.portal_url;
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to open billing portal.'
      );
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price}`;
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    if (limit === 0) return 'None';
    return limit.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free, upgrade when you need more. Save 90% on AI costs with intelligent model routing.
          </p>
          <button
            onClick={handleManageBilling}
            className="mt-4 text-sm text-blue-600 underline hover:text-blue-800"
          >
            Already subscribed? Manage billing
          </button>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Save {pricingData?.annual_discount_pct}%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {pricingData?.tiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                tier.popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {tier.popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{tier.recommended_for}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(billingCycle === 'monthly' ? tier.price_monthly : tier.price_annual)}
                  </span>
                  {tier.price_monthly > 0 && (
                    <span className="text-gray-600 ml-2">
                      /{billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="text-sm">
                    <span className="font-semibold">Research Queries:</span>{' '}
                    <span className="text-gray-600">{formatLimit(tier.limits.research_queries)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Automation Runs:</span>{' '}
                    <span className="text-gray-600">{formatLimit(tier.limits.automation_runs)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">API Calls:</span>{' '}
                    <span className="text-gray-600">{formatLimit(tier.limits.api_calls)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Team Members:</span>{' '}
                    <span className="text-gray-600">{formatLimit(tier.limits.team_members)}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={checkoutLoading === tier.id}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                    tier.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {checkoutLoading === tier.id && (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  )}
                  {tier.price_monthly === 0 ? 'Start Free' : 'Subscribe Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                  {pricingData?.tiers.map((tier) => (
                    <th key={tier.id} className="text-center py-3 px-4 font-semibold text-gray-900">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">Research Queries</td>
                  {pricingData?.tiers.map((tier) => (
                    <td key={tier.id} className="text-center py-3 px-4 text-gray-600">
                      {formatLimit(tier.limits.research_queries)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">Web Automation</td>
                  {pricingData?.tiers.map((tier) => (
                    <td key={tier.id} className="text-center py-3 px-4">
                      {tier.limits.automation_runs > 0 || tier.limits.automation_runs === -1 ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">Multi-Agent Orchestration</td>
                  {pricingData?.tiers.map((tier) => (
                    <td key={tier.id} className="text-center py-3 px-4">
                      {tier.id === 'enterprise' ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">Priority Support</td>
                  {pricingData?.tiers.map((tier) => (
                    <td key={tier.id} className="text-center py-3 px-4">
                      {tier.price_monthly >= 99 ? (
                        <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-700">Team Members</td>
                  {pricingData?.tiers.map((tier) => (
                    <td key={tier.id} className="text-center py-3 px-4 text-gray-600">
                      {formatLimit(tier.limits.team_members)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">For SaaS Partners</h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">License the agent execution runtime for your product. Embed autonomous AI task execution natively — charged per execution minute like Twilio charges per minute.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-1">Starter Runtime</h3>
              <p className="text-gray-400 text-sm mb-4">For early-stage SaaS products</p>
              <div className="mb-4"><span className="text-4xl font-bold text-white">$2,000</span><span className="text-gray-400 ml-2">/month</span></div>
              <ul className="space-y-2 mb-6 text-sm text-gray-300">
                <li>500 execution minutes/month</li>
                <li>Up to 3 concurrent agents</li>
                <li>Basic HITL (human-in-the-loop)</li>
                <li>Partner API key + tenant isolation</li>
                <li>$0.02/min overage</li>
              </ul>
              <a href="mailto:sales@karios.ai" className="block w-full py-3 px-4 rounded-lg font-semibold text-center bg-gray-700 text-white hover:bg-gray-600 transition-colors">Contact Sales</a>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-blue-500 ring-2 ring-blue-500">
              <div className="bg-blue-600 text-white text-center py-1 text-xs font-semibold rounded mb-4">Most Popular</div>
              <h3 className="text-xl font-bold text-white mb-1">Growth Runtime</h3>
              <p className="text-gray-400 text-sm mb-4">For scaling SaaS teams</p>
              <div className="mb-4"><span className="text-4xl font-bold text-white">$5,000</span><span className="text-gray-400 ml-2">/month</span></div>
              <ul className="space-y-2 mb-6 text-sm text-gray-300">
                <li>2,000 execution minutes/month</li>
                <li>Up to 10 concurrent agents</li>
                <li>Full HITL config + webhook reporting</li>
                <li>Partner API key + tenant isolation</li>
                <li>$0.02/min overage</li>
              </ul>
              <a href="mailto:sales@karios.ai" className="block w-full py-3 px-4 rounded-lg font-semibold text-center bg-blue-600 text-white hover:bg-blue-700 transition-colors">Contact Sales</a>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-1">Enterprise Runtime</h3>
              <p className="text-gray-400 text-sm mb-4">For enterprise SaaS platforms</p>
              <div className="mb-4"><span className="text-4xl font-bold text-white">$10,000+</span><span className="text-gray-400 ml-2">/month</span></div>
              <ul className="space-y-2 mb-6 text-sm text-gray-300">
                <li>Unlimited execution minutes</li>
                <li>Unlimited agents</li>
                <li>SSO passthrough + audit log API</li>
                <li>SLA guarantee</li>
                <li>$0.02/min overage</li>
              </ul>
              <a href="mailto:sales@karios.ai" className="block w-full py-3 px-4 rounded-lg font-semibold text-center bg-gray-700 text-white hover:bg-gray-600 transition-colors">Contact Sales</a>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <div className="bg-white rounded-lg p-6 shadow">
              <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-600">
                Yes. Use the "Manage billing" link to upgrade, downgrade, or cancel through
                the Stripe billing portal. Changes take effect immediately or at the end of your billing period.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600">
                All major credit and debit cards (Visa, Mastercard, Amex) via Stripe's
                secure checkout. No card details ever touch our servers.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h4 className="font-semibold text-gray-900 mb-2">How does the cost optimization work?</h4>
              <p className="text-gray-600">
                Our intelligent router analyzes each query and selects the most cost-effective
                AI model while maintaining quality. Simple queries use cheaper models; complex
                ones use premium models.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h4 className="font-semibold text-gray-900 mb-2">What happens if I exceed my limits?</h4>
              <p className="text-gray-600">
                You'll see a clear message when you hit your limit. Free users will be prompted
                to upgrade. Paid users on metered plans will be charged overage at standard rates.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h4 className="font-semibold text-gray-900 mb-2">How does the partner runtime work?</h4>
              <p className="text-gray-600">
                You embed our agent execution runtime into your SaaS product using a partner API key. Your users run autonomous AI tasks inside your product — we handle the execution infrastructure, browser automation, HITL gates, and audit trails. You're billed monthly based on your plan tier plus any execution minute overage.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h4 className="font-semibold text-gray-900 mb-2">What is an execution minute?</h4>
              <p className="text-gray-600">
                An execution minute is one minute of active agent task processing — browser automation, AI reasoning, tool calls, and data extraction. Idle time between steps is not counted. Plans include a monthly pool of execution minutes; overage is billed at $0.02/minute.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
