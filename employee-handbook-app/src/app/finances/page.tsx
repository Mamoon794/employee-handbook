'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, CreditCard, Clock, CheckCircle, AlertTriangle, ExternalLink, Users, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Header } from '../global_components';

interface SubscriptionData {
  subscribed: boolean;
  isTrialPeriod?: boolean;
  trialEndsAt?: string;
  trialEnded?: boolean;
}

const pricingTiers = [
  { min: 1, max: 9, price: 1.00 },
  { min: 10, max: 49, price: 0.90 },
  { min: 50, max: 99, price: 0.80 },
  { min: 100, max: 499, price: 0.70 },
  { min: 500, max: 999, price: 0.60 },
  { min: 1000, max: 4999, price: 0.50 },
  { min: 5000, max: 9999, price: 0.40 },
  { min: 10000, max: 19999, price: 0.35 },
  { min: 20000, max: 49999, price: 0.30 },
  { min: 50000, max: 99999, price: 0.25 },
];

export default function Finances() {
  const router = useRouter();
  const { user } = useUser();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [processingCancellation, setProcessingCancellation] = useState(false);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loadingEmployeeCount, setLoadingEmployeeCount] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  useEffect(() => {
    if (user) {
      fetchEmployeeCount();
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/check-subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      const data = await response.json();
      setSubscriptionData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeCount = async () => {
    if (!user) {
      setLoadingEmployeeCount(false);
      return;
    }

    try {
      setLoadingEmployeeCount(true);
      const companyId = user.unsafeMetadata?.companyId as string;
      
      if (!companyId) {
        console.log('No company ID found for user');
        setEmployeeCount(0);
        setLoadingEmployeeCount(false);
        return;
      }

      const response = await fetch(`/api/company/${companyId}/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee count');
      }
      
      const users = await response.json();
      const employees = users.filter((user: { userType: string }) => user.userType === 'Employee');
      setEmployeeCount(employees.length);
    } catch (err) {
      console.error('Error fetching employee count:', err);
      setEmployeeCount(0);
    } finally {
      setLoadingEmployeeCount(false);
    }
  };

  const getPricingForEmployeeCount = (count: number) => {
    const tier = pricingTiers.find(tier => count >= tier.min && count <= tier.max);
    return tier ? tier.price : pricingTiers[pricingTiers.length - 1].price;
  };

  const calculateMonthlyTotal = (count: number) => {
    if (count === 0) return 0;
    const pricePerEmployee = getPricingForEmployeeCount(count);
    return count * pricePerEmployee;
  };

  const handleUpgrade = async () => {
    try {
      setProcessingCheckout(true);
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setProcessingCheckout(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      return;
    }

    try {
      setProcessingCancellation(true);
      setError(null);
      
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh subscription status to reflect the cancellation
        await fetchSubscriptionStatus();
        // Show success message (you could add a success state if desired)
        alert('Subscription cancelled successfully. You will retain access until the end of your current billing period.');
      } else {
        throw new Error(result.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setProcessingCancellation(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionStatus = () => {
    if (!subscriptionData) return { status: 'loading', color: 'gray', icon: Clock };
    
    if (subscriptionData.subscribed && subscriptionData.isTrialPeriod) {
      return { status: 'Trial Period', color: 'blue', icon: Clock };
    }
    
    if (subscriptionData.subscribed && !subscriptionData.isTrialPeriod) {
      return { status: 'Active Subscription', color: 'green', icon: CheckCircle };
    }
    
    if (subscriptionData.trialEnded) {
      return { status: 'Trial Expired', color: 'red', icon: AlertTriangle };
    }
    
    return { status: 'No Subscription', color: 'gray', icon: AlertTriangle };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showHeader={false} province="" setProvince={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading subscription information...</p>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getSubscriptionStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showHeader={false} province="" setProvince={() => {}} />
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Subscription & Billing</h1>
              <p className="text-gray-600">Manage your Employee Handbook membership</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full ${
                  statusInfo.color === 'green' ? 'bg-green-100' :
                  statusInfo.color === 'blue' ? 'bg-blue-100' :
                  statusInfo.color === 'red' ? 'bg-red-100' :
                  'bg-gray-100'
                }`}>
                  <StatusIcon className={`w-6 h-6 ${
                    statusInfo.color === 'green' ? 'text-green-600' :
                    statusInfo.color === 'blue' ? 'text-blue-600' :
                    statusInfo.color === 'red' ? 'text-red-600' :
                    'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{statusInfo.status}</h2>
                  <p className="text-gray-600">
                    {subscriptionData?.isTrialPeriod && subscriptionData.trialEndsAt
                      ? `Trial ends on ${formatDate(subscriptionData.trialEndsAt)}`
                      : subscriptionData?.subscribed && !subscriptionData.isTrialPeriod
                      ? 'Your premium subscription is active'
                      : subscriptionData?.trialEnded
                      ? 'Your trial has expired. Upgrade to continue using premium features'
                      : 'Get access to premium employee handbook features'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Plan Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Plan Type:</span>
                    <span className="font-medium text-gray-900">
                      {subscriptionData?.subscribed ? 'Premium Access' : 'Free Trial'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Employees:</span>
                    <span className="font-medium text-gray-900">
                      {loadingEmployeeCount ? 'Loading...' : `${employeeCount} employees`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Rate per Employee:</span>
                    <span className="font-medium text-gray-900">
                      {loadingEmployeeCount ? 'Loading...' : `$${getPricingForEmployeeCount(employeeCount).toFixed(2)}/month`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Monthly Total:</span>
                    <span className="font-bold text-blue-600">
                      {loadingEmployeeCount ? 'Loading...' : `$${calculateMonthlyTotal(employeeCount).toFixed(2)} USD`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Billing:</span>
                    <span className="font-medium text-gray-900">Monthly subscription</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Features Included</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    AI-powered chat assistance
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Document upload & analysis
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Employee management tools
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Analytics dashboard
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {(!subscriptionData?.subscribed || subscriptionData?.trialEnded) && (
                <button
                  onClick={handleUpgrade}
                  disabled={processingCheckout || loadingEmployeeCount || employeeCount === 0}
                  className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {processingCheckout ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : loadingEmployeeCount ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : employeeCount === 0 ? (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      No Employees Found
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Upgrade to Premium - ${calculateMonthlyTotal(employeeCount).toFixed(2)}/month
                    </>
                  )}
                </button>
              )}

              {subscriptionData?.subscribed && !subscriptionData?.isTrialPeriod && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={processingCancellation}
                  className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {processingCancellation ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Subscription
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={() => {
                  fetchSubscriptionStatus();
                  fetchEmployeeCount();
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Pricing Tiers
            </h3>
            <p className="text-gray-600 mt-1">Monthly pricing based on number of employees</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pricingTiers.map((tier, index) => {
                const isCurrentTier = employeeCount >= tier.min && employeeCount <= tier.max && employeeCount > 0;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      isCurrentTier
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`text-sm font-medium mb-2 ${
                        isCurrentTier ? 'text-blue-800' : 'text-gray-700'
                      }`}>
                        {tier.min.toLocaleString()}-{tier.max.toLocaleString()} employees
                      </div>
                      <div className={`text-lg font-bold ${
                        isCurrentTier ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        ${tier.price.toFixed(2)}/month
                      </div>
                      <div className="text-xs text-gray-500 mt-1">per employee</div>
                      {isCurrentTier && (
                        <div className="mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Your Current Tier
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {employeeCount === 0 && !loadingEmployeeCount && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 text-sm">
                    No employees found in your organization. Add employees to see your pricing tier.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
              Payment Information
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Secure Payment Processing</h4>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                All payments are processed securely through Stripe. We don&apos;t store your payment information on our servers.
              </p>
              
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  SSL Encrypted
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  PCI Compliant
                </div>
                <div className="flex items-center">
                  <ExternalLink className="w-4 h-4 text-blue-500 mr-1" />
                  Powered by Stripe
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 