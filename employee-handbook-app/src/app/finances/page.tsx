'use client';

import { useState } from 'react';
import { ArrowLeft, DollarSign, CreditCard, TrendingUp, Calendar, Download, CheckCircle, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '../global_components';

export default function Finances() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('30d');

  const financialData = {
    currentBilling: {
      total: 249.99,
      basePlan: 199.99,
      employeeCharges: 50.00,
      employeeCount: 25,
      perEmployeeRate: 2.00
    },
    billingHistory: [
      { month: 'Jun 2024', amount: 249.99, status: 'Paid', date: '2024-06-01' },
      { month: 'May 2024', amount: 239.99, status: 'Paid', date: '2024-05-01' },
      { month: 'Apr 2024', amount: 229.99, status: 'Paid', date: '2024-04-01' },
      { month: 'Mar 2024', amount: 219.99, status: 'Paid', date: '2024-03-01' },
      { month: 'Feb 2024', amount: 209.99, status: 'Paid', date: '2024-02-01' },
      { month: 'Jan 2024', amount: 199.99, status: 'Paid', date: '2024-01-01' }
    ],
    upcomingBilling: {
      nextDueDate: '2024-07-01',
      estimatedAmount: 259.99,
      employeeProjection: 30
    },
    costBreakdown: [
      { category: 'Base Plan', amount: 199.99, percentage: 80 },
      { category: 'Employee Charges', amount: 50.00, percentage: 20 }
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showHeader={false} province=""  setProvince={()=>{}}/>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Financial Overview</h1>
              <p className="text-gray-600">Subscription costs and billing reports</p>
            </div>
          </div>
          
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-800 font-semibold rounded-lg shadow-sm hover:border-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Monthly Bill</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(financialData.currentBilling.total)}
                </p>
                <p className="text-sm text-green-600 mt-1">Due {formatDate(financialData.upcomingBilling.nextDueDate)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Employees Billed</p>
                <p className="text-3xl font-bold text-gray-900">{financialData.currentBilling.employeeCount}</p>
                <p className="text-sm text-blue-600 mt-1">@{formatCurrency(financialData.currentBilling.perEmployeeRate)}/employee</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Month Estimate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(financialData.upcomingBilling.estimatedAmount)}
                </p>
                <p className="text-sm text-orange-600 mt-1">+{financialData.upcomingBilling.employeeProjection - financialData.currentBilling.employeeCount} employees</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Trend</p>
                <p className="text-3xl font-bold text-gray-900">+4.2%</p>
                <p className="text-sm text-orange-600 mt-1">vs last month</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                Cost Breakdown
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {financialData.costBreakdown.map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                        index === 0 ? 'from-blue-400 to-blue-600' :
                        'from-green-400 to-green-600'
                      }`} />
                      <span className="font-medium text-gray-900">{item.category}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{item.percentage}%</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 space-y-2">
                {financialData.costBreakdown.map((item, index) => (
                  <div key={item.category} className="flex items-center space-x-3">
                    <div className="w-24 text-xs text-gray-600 truncate">{item.category}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${
                          index === 0 ? 'from-blue-400 to-blue-600' :
                          'from-green-400 to-green-600'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-xs text-gray-600 text-right">{formatCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                Billing History
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {financialData.billingHistory.map((item) => (
                  <div key={item.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.month}</p>
                        <p className="text-sm text-gray-600">{formatDate(item.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                      <p className="text-sm text-green-600">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Download Invoice</h3>
            </div>
            <p className="text-gray-600 mb-4">Get a detailed breakdown of your current billing period for accounting records.</p>
            <button className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Download PDF
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Financial Report</h3>
            </div>
            <p className="text-gray-600 mb-4">Generate a comprehensive financial report for budget planning and analysis.</p>
            <button className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 