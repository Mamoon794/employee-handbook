"use client"

import { useState, useEffect, use } from "react"
import {
  ArrowLeft,
  Users,
  MapPin,
  TrendingUp,
  FileText,
  MessageSquare,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  getTotalEmployees,
  getProvinceDistribution,
  getTotalQuestionsAsked,
  getMonthlyData,
  getAIExplanationForEmployeeDistribution,
  getAIExplanationForEmployeeRegistration,
  getAIExplanationForQuestionsAsked,
} from "./utils/analytics.utility"
import DateRangePicker from "./components/DateRangePicker"

export default function Analytics() {
  const router = useRouter()
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [provinceData, setProvinceData] = useState<
    Array<{ province: string; count: number; percentage: number }>
  >([])
  const [loading, setLoading] = useState(true)
  const [totalQuestionsAsked, setTotalQuestionsAsked] = useState(0)
  const [monthlyChartData, setMonthlyChartData] = useState<
    Array<{
      month: string
      employees: number
      questions: number
      documents: number
    }>
  >([])
  const [
    aiExplanationForEmployeeDistribution,
    setAIExplanationForEmployeeDistribution,
  ] = useState("")
  const [
    aiExplanationForEmployeeRegistration,
    setAIExplanationForEmployeeRegistration,
  ] = useState("")
  const [aiExplanationForQuestionsAsked, setAIExplanationForQuestionsAsked] =
    useState("")

  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true)
      try {
        const [
          employeeCount,
          provinceDistribution,
          questionsAsked,
          monthlyAnalytics,
        ] = await Promise.all([
          getTotalEmployees(startDate, endDate),
          getProvinceDistribution(startDate, endDate),
          getTotalQuestionsAsked(startDate, endDate),
          getMonthlyData(startDate, endDate),
        ])

        setTotalEmployees(employeeCount)
        setProvinceData(provinceDistribution)
        setTotalQuestionsAsked(questionsAsked)
        setMonthlyChartData(monthlyAnalytics)
      } catch (error) {
        console.error("Error fetching analytics data:", error)
        setTotalEmployees(0)
        setProvinceData([])
        setTotalQuestionsAsked(0)
        setMonthlyChartData([])
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [startDate, endDate])

  useEffect(() => {
    const fetchAIExplanationForEmployeeDistribution = async () => {
      const explanation = await getAIExplanationForEmployeeDistribution(
        provinceData
      )
      setAIExplanationForEmployeeDistribution(explanation)
    }

    if (provinceData.length > 0) {
      fetchAIExplanationForEmployeeDistribution()
    }
  }, [provinceData])

  useEffect(() => {
    const fetchAIExplanationForMonthlyChart = async () => {
      const explanationForEmployeeRegistration =
        await getAIExplanationForEmployeeRegistration(monthlyChartData)

      setAIExplanationForEmployeeRegistration(
        explanationForEmployeeRegistration
      )

      const explanationForQuestionsAsked =
        await getAIExplanationForQuestionsAsked(monthlyChartData)

      setAIExplanationForQuestionsAsked(explanationForQuestionsAsked)
    }

    if (monthlyChartData.length > 0) {
      fetchAIExplanationForMonthlyChart()
    }
  }, [monthlyChartData])

  const employeeStats = {
    total: totalEmployees,
    active: 231,
    newThisMonth: 18,
    retentionRate: 94.2,
  }

  const topQuestions = [
    { question: "What are my vacation entitlements?", count: 34 },
    { question: "How do I request time off?", count: 28 },
    { question: "What is the dress code policy?", count: 22 },
    { question: "How do I access my benefits?", count: 19 },
    { question: "What are the remote work policies?", count: 15 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header
        className="bg-white shadow-sm border-b"
        role="banner"
        aria-label="Employee Analytics Header"
      >
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
              <h1 className="text-2xl font-bold text-blue-800">
                Employee Analytics
              </h1>
              <p className="text-gray-600">Insights into your workforce</p>
            </div>
          </div>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
          />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Employees
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "..." : employeeStats.total}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{employeeStats.newThisMonth} this month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Retention Rate
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {employeeStats.retentionRate}%
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +2.3% vs last period
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Questions Asked
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "..." : totalQuestionsAsked}
                </p>
                <p className="text-sm text-orange-600 mt-1">+14% this month</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <MessageSquare className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Documents Uploaded
                </p>
                <p className="text-3xl font-bold text-gray-900">38</p>
                <p className="text-sm text-indigo-600 mt-1">+12 this month</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Employee Distribution by Province */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Employee Distribution by Province
              </h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading province data...</p>
                </div>
              ) : provinceData.length > 0 ? (
                <>
                  <div className="sr-only" aria-live="polite">
                    Analytics for employee distribution by province:
                    {aiExplanationForEmployeeDistribution ||
                      "No explanation available."}
                  </div>

                  <div className="space-y-4">
                    {provinceData.map((item, index) => (
                      <div
                        key={item.province}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                              index === 0
                                ? "from-blue-400 to-blue-600"
                                : index === 1
                                ? "from-green-400 to-green-600"
                                : index === 2
                                ? "from-purple-400 to-purple-600"
                                : index === 3
                                ? "from-orange-400 to-orange-600"
                                : index === 4
                                ? "from-pink-400 to-pink-600"
                                : "from-gray-400 to-gray-600"
                            }`}
                          />
                          <span className="font-medium text-gray-900">
                            {item.province}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            {item.count} employees
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-2">
                    {provinceData.map((item, index) => (
                      <div
                        key={item.province}
                        className="flex items-center space-x-3"
                      >
                        <div className="w-16 text-xs text-gray-600 truncate">
                          {item.province}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${
                              index === 0
                                ? "from-blue-400 to-blue-600"
                                : index === 1
                                ? "from-green-400 to-green-600"
                                : index === 2
                                ? "from-purple-400 to-purple-600"
                                : index === 3
                                ? "from-orange-400 to-orange-600"
                                : index === 4
                                ? "from-pink-400 to-pink-600"
                                : "from-gray-400 to-gray-600"
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No province data available for selected date range
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Growth Trends */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Analytics Overview
              </h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">
                    Loading analytics data...
                  </p>
                </div>
              ) : monthlyChartData.length > 0 ? (
                <div className="space-y-8">
                  {/* Employee Registrations Chart */}
                  <div>
                    <div className="sr-only" aria-live="polite">
                      Analytics for employee registrations:
                      {aiExplanationForEmployeeRegistration ||
                        "No explanation available."}
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-gray-700">
                        {monthlyChartData.some((data) =>
                          [
                            "Sun",
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                          ].includes(data.month)
                        )
                          ? "Daily Employee Registrations"
                          : "Monthly Employee Registrations"}
                      </span>
                      <span className="text-sm text-blue-600">
                        Total:{" "}
                        {monthlyChartData.reduce(
                          (sum, data) => sum + data.employees,
                          0
                        )}
                      </span>
                    </div>
                    <div className="relative h-40 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-end justify-between h-full space-x-2">
                        {monthlyChartData.map((data, index) => {
                          const maxEmployees = Math.max(
                            ...monthlyChartData.map((d) => d.employees)
                          )
                          const heightPercentage =
                            maxEmployees > 0
                              ? (data.employees / maxEmployees) * 100
                              : 0

                          return (
                            <div
                              key={index}
                              className="flex-1 flex flex-col items-center h-full justify-end"
                            >
                              <div className="relative w-full flex flex-col items-center justify-end h-full">
                                {data.employees > 0 && (
                                  <span className="text-xs text-gray-600 mb-1">
                                    {data.employees}
                                  </span>
                                )}
                                {data.employees > 0 ? (
                                  <div
                                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-300 hover:from-blue-700 hover:to-blue-500"
                                    style={{ height: `${heightPercentage}%` }}
                                  />
                                ) : (
                                  <div className="w-full h-1 bg-gray-300 rounded-sm opacity-50" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600 mt-2 text-center">
                                {data.month}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Questions Asked Chart */}
                  <div>
                    <div className="sr-only" aria-live="polite">
                      Analytics for questions asked:
                      {aiExplanationForQuestionsAsked ||
                        "No explanation available."}
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-gray-700">
                        {monthlyChartData.some((data) =>
                          [
                            "Sun",
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                          ].includes(data.month)
                        )
                          ? "Daily Questions Asked"
                          : "Monthly Questions Asked"}
                      </span>
                      <span className="text-sm text-orange-600">
                        Total:{" "}
                        {monthlyChartData.reduce(
                          (sum, data) => sum + data.questions,
                          0
                        )}
                      </span>
                    </div>
                    <div className="relative h-40 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-end justify-between h-full space-x-2">
                        {monthlyChartData.map((data, index) => {
                          const maxQuestions = Math.max(
                            ...monthlyChartData.map((d) => d.questions)
                          )
                          const heightPercentage =
                            maxQuestions > 0
                              ? (data.questions / maxQuestions) * 100
                              : 0

                          return (
                            <div
                              key={index}
                              className="flex-1 flex flex-col items-center h-full justify-end"
                            >
                              <div className="relative w-full flex flex-col items-center justify-end h-full">
                                {data.questions > 0 && (
                                  <span className="text-xs text-gray-600 mb-1">
                                    {data.questions}
                                  </span>
                                )}
                                {data.questions > 0 ? (
                                  <div
                                    className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-sm transition-all duration-300 hover:from-orange-700 hover:to-orange-500"
                                    style={{ height: `${heightPercentage}%` }}
                                  />
                                ) : (
                                  <div className="w-full h-1 bg-gray-300 rounded-sm opacity-50" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600 mt-2 text-center">
                                {data.month}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No data available for selected date range
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Employee Questions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
              Most Frequently Asked Questions
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Help identify areas for policy clarification
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topQuestions.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-purple-600">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">{item.question}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Asked</span>
                    <span className="font-semibold text-purple-600">
                      {item.count} times
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
