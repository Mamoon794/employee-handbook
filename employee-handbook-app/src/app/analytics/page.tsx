"use client"

import { useState, useEffect } from "react"
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
  getEmployees,
  getProvinceDistribution,
  getActiveUsers,
  getQuestionsAsked,
  getDocuments,
  getMonthlyData,
  getAIExplanationForEmployeeDistribution,
  getAIExplanationForEmployeeRegistration,
  getAIExplanationForQuestionsAsked,
  getBulletPointSummary,
  getTopQuestions,
} from "./utils/analytics.utility"
import DateRangePicker from "./components/DateRangePicker"
import TypewriterEffect from "./components/TypewriterEffect"
import Link from "next/link"

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
  const [newEmployees, setNewEmployees] = useState(0)
  const [provinceData, setProvinceData] = useState<
    Array<{ province: string; count: number; percentage: number }>
  >([])
  const [loading, setLoading] = useState(true)
  const [totalActiveUsers, setTotalActiveUsers] = useState(0)
  const [totalQuestionsAsked, setTotalQuestionsAsked] = useState(0)
  const [newQuestionsAsked, setNewQuestionsAsked] = useState(0)
  const [totalDocumentsUploaded, setTotalDocumentsUploaded] = useState(0)
  const [newDocumentsUploaded, setNewDocumentsUploaded] = useState(0)
  const [topQuestions, setTopQuestions] = useState<
    Array<{
      id: string
      province: string
      text: string
    }>
  >([])
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
  const [
    bulletPointsEmployeeDistribution,
    setBulletPointsEmployeeDistribution,
  ] = useState("")
  const [
    bulletPointsEmployeeRegistration,
    setBulletPointsEmployeeRegistration,
  ] = useState("")
  const [bulletPointsQuestionsAsked, setBulletPointsQuestionsAsked] =
    useState("")
  const [loadingBulletPointsDistribution, setLoadingBulletPointsDistribution] =
    useState(false)
  const [loadingBulletPointsRegistration, setLoadingBulletPointsRegistration] =
    useState(false)
  const [loadingBulletPointsQuestions, setLoadingBulletPointsQuestions] =
    useState(false)

  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  useEffect(() => {
    const companyId = localStorage.getItem("companyId") || ""
    if (!companyId) {
      alert("Error: Company ID not found. Please log in again.")
      console.error("Company ID not found in localStorage")
      return
    }
    const companyName = localStorage.getItem("companyName") || ""
    if (!companyName) {
      alert("Error: Company Name not found. Please log in again.")
      console.error("Company Name not found in localStorage")
      return
    }

    const fetchAnalyticsData = async () => {
      setLoading(true)
      // Set loading states for AI insights when timeline changes
      setLoadingBulletPointsDistribution(true)
      setLoadingBulletPointsRegistration(true)
      setLoadingBulletPointsQuestions(true)
      // Clear existing AI insights
      setBulletPointsEmployeeDistribution("")
      setBulletPointsEmployeeRegistration("")
      setBulletPointsQuestionsAsked("")

      try {
        const [
          { totalEmployees, newEmployees },
          provinceDistribution,
          totalActiveUsers,
          { totalQuestionsAsked, newQuestionsAsked },
          { totalDocumentsUploaded, newDocumentsUploaded },
          monthlyAnalytics,
          topQuestions,
        ] = await Promise.all([
          getEmployees(startDate, endDate, companyId),
          getProvinceDistribution(startDate, endDate, companyId),
          getActiveUsers(startDate, endDate, companyId),
          getQuestionsAsked(startDate, endDate, companyId),
          getDocuments(startDate, endDate, companyId),
          getMonthlyData(startDate, endDate, companyId),
          getTopQuestions(startDate, endDate, companyName),
        ])

        setTotalEmployees(totalEmployees)
        setNewEmployees(newEmployees)
        setProvinceData(provinceDistribution)
        setTotalQuestionsAsked(totalQuestionsAsked)
        setNewQuestionsAsked(newQuestionsAsked)
        setTotalDocumentsUploaded(totalDocumentsUploaded)
        setTotalActiveUsers(totalActiveUsers)
        setNewDocumentsUploaded(newDocumentsUploaded)
        setMonthlyChartData(monthlyAnalytics)
        setTopQuestions(topQuestions)
      } catch (error) {
        console.error("Error fetching analytics data:", error)
        setTotalEmployees(0)
        setNewEmployees(0)
        setProvinceData([])
        setTotalQuestionsAsked(0)
        setNewQuestionsAsked(0)
        setTotalDocumentsUploaded(0)
        setNewDocumentsUploaded(0)
        setMonthlyChartData([])
        // Stop loading states on error
        setLoadingBulletPointsDistribution(false)
        setLoadingBulletPointsRegistration(false)
        setLoadingBulletPointsQuestions(false)
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

  // Single effect to handle all bullet points with rate limiting
  useEffect(() => {
    const fetchAllBulletPoints = async () => {
      // Wait for all AI explanations to be ready
      if (
        aiExplanationForEmployeeDistribution &&
        aiExplanationForEmployeeRegistration &&
        aiExplanationForQuestionsAsked
      ) {
        // Set all loading states
        setLoadingBulletPointsDistribution(true)
        setLoadingBulletPointsRegistration(true)
        setLoadingBulletPointsQuestions(true)

        // Clear existing bullet points
        setBulletPointsEmployeeDistribution("")
        setBulletPointsEmployeeRegistration("")
        setBulletPointsQuestionsAsked("")

        try {
          // Add delay between calls to respect rate limits
          const bulletPointsDistribution = await getBulletPointSummary(
            aiExplanationForEmployeeDistribution
          )
          setBulletPointsEmployeeDistribution(bulletPointsDistribution)
          setLoadingBulletPointsDistribution(false)

          // Wait 2 seconds between calls
          await new Promise((resolve) => setTimeout(resolve, 2000))

          const bulletPointsRegistration = await getBulletPointSummary(
            aiExplanationForEmployeeRegistration
          )
          setBulletPointsEmployeeRegistration(bulletPointsRegistration)
          setLoadingBulletPointsRegistration(false)

          // Wait 2 seconds between calls
          await new Promise((resolve) => setTimeout(resolve, 2000))

          const bulletPointsQuestions = await getBulletPointSummary(
            aiExplanationForQuestionsAsked
          )
          setBulletPointsQuestionsAsked(bulletPointsQuestions)
          setLoadingBulletPointsQuestions(false)
        } catch (error) {
          console.error("Error fetching bullet points:", error)
          // Stop all loading states on error
          setLoadingBulletPointsDistribution(false)
          setLoadingBulletPointsRegistration(false)
          setLoadingBulletPointsQuestions(false)
        }
      }
    }

    fetchAllBulletPoints()
  }, [
    aiExplanationForEmployeeDistribution,
    aiExplanationForEmployeeRegistration,
    aiExplanationForQuestionsAsked,
  ])

  const employeeStats = {
    total: newEmployees,
    active: 231,
    newThisMonth: 18,
    retentionRate: 94.2,
  }

  // const topQuestions = [
  //   { question: "What are my vacation entitlements?", count: 34 },
  //   { question: "How do I request time off?", count: 28 },
  //   { question: "What is the dress code policy?", count: 22 },
  //   { question: "How do I access my benefits?", count: 19 },
  //   { question: "What are the remote work policies?", count: 15 },
  // ]

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
              <Link href="/dashboard">
                <h1 className="text-2xl font-extrabold italic text-blue-800">
                  Gail
                </h1>
              </Link>
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
                  Company Size
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "..." : totalEmployees}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{newEmployees} this period
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
                  Active Users
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalActiveUsers}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {totalActiveUsers > 0 && totalEmployees > 0
                    ? ((totalActiveUsers / totalEmployees) * 100).toFixed(2)
                    : 0}
                  % engagement rate
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
                <p className="text-sm text-orange-600 mt-1">
                  +{newQuestionsAsked} this period
                </p>
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
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "..." : totalDocumentsUploaded}
                </p>
                <p className="text-sm text-indigo-600 mt-1">
                  +{newDocumentsUploaded} this period
                </p>
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

                  {/* AI Insights Caption - Always Visible */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Province Distribution Insights
                    </h4>
                    {loadingBulletPointsDistribution ? (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Generating AI insights...</span>
                      </div>
                    ) : bulletPointsEmployeeDistribution ? (
                      <TypewriterEffect
                        text={bulletPointsEmployeeDistribution}
                        speed={30}
                        className="text-sm"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">
                        No insights available
                      </p>
                    )}
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

                    {/* Registration Insights - Always Visible */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <h5 className="text-xs font-semibold text-blue-800 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Registration Insights
                      </h5>
                      {loadingBulletPointsRegistration ? (
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          <span>Generating insights...</span>
                        </div>
                      ) : bulletPointsEmployeeRegistration ? (
                        <TypewriterEffect
                          text={bulletPointsEmployeeRegistration}
                          speed={25}
                          className="text-xs"
                        />
                      ) : (
                        <p className="text-xs text-gray-500">
                          No insights available
                        </p>
                      )}
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

                    {/* Questions Insights - Always Visible */}
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <h5 className="text-xs font-semibold text-orange-800 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        Questions Insights
                      </h5>
                      {loadingBulletPointsQuestions ? (
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
                          <span>Generating insights...</span>
                        </div>
                      ) : bulletPointsQuestionsAsked ? (
                        <TypewriterEffect
                          text={bulletPointsQuestionsAsked}
                          speed={25}
                          className="text-xs"
                        />
                      ) : (
                        <p className="text-xs text-gray-500">
                          No insights available
                        </p>
                      )}
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
                    <p className="text-gray-900 font-medium">{item.text}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">From</span>
                    <span className="font-semibold text-purple-600">
                      {item.province}
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
