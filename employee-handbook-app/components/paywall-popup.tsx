/* eslint-disable */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import axios from "axios"

const pricingTiers = [
  { min: 1, max: 9, price: 1.0 },
  { min: 10, max: 49, price: 0.9 },
  { min: 50, max: 99, price: 0.8 },
  { min: 100, max: 499, price: 0.7 },
  { min: 500, max: 999, price: 0.6 },
  { min: 1000, max: 4999, price: 0.5 },
  { min: 5000, max: 9999, price: 0.4 },
  { min: 10000, max: 19999, price: 0.35 },
  { min: 20000, max: 49999, price: 0.3 },
  { min: 50000, max: 99999, price: 0.25 },
]

export default function PaywallModal() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [employeeCount, setEmployeeCount] = useState(0)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()

  useEffect(() => {
    const fetchEmployeeCount = async () => {
      if (!user) {
        setIsLoadingCount(false)
        return
      }

      try {
        // Get company ID from user metadata
        const companyId = user.unsafeMetadata?.companyId as string

        if (!companyId) {
          console.log("No company ID found for user")
          setEmployeeCount(0)
          setIsLoadingCount(false)
          return
        }

        // Fetch employees for the company
        const response = await axios.get(`/api/company/${companyId}/users`)
        const users = response.data

        // Count only employees (not owners, administrators, etc.)
        // const employees = users.filter((user: { userType: string }) => user.userType === 'Employee');
        setEmployeeCount(users.length - 1)
      } catch (error) {
        console.error("Error fetching employee count:", error)
        setEmployeeCount(0)
      } finally {
        setIsLoadingCount(false)
      }
    }

    fetchEmployeeCount()
  }, [user])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await axios.post("/api/stripe/checkout")
      router.push(res.data.url)
    } catch (err) {
      console.error(err)
      setError("Failed to start checkout session.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-lg px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-sm sm:max-w-md w-full text-center relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-extrabold text-blue-800 mb-4 sm:mb-6 text-center">
          Unlock Premium Features
        </h2>

        <div className="mb-4 sm:mb-6">
          <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 sm:mb-3 text-center">
            Premium Features:
          </h3>
          <ul className="text-left space-y-1 sm:space-y-2 text-gray-700 text-xs sm:text-sm pl-2 sm:pl-4">
            <li>• AI-powered document analysis and Q&A</li>
            <li>• Advanced analytics and insights</li>
            <li>• Priority customer support</li>
          </ul>
        </div>

        <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-[#f5f7fb] rounded-lg">
          <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 sm:mb-3 text-center">
            Monthly Pricing:
          </h3>

          {/* Employee Count Display */}
          <div className="mb-3 sm:mb-4">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Your Number of Employees:
              </span>
              {isLoadingCount ? (
                <span className="text-base sm:text-lg font-bold text-blue-800">
                  Loading...
                </span>
              ) : (
                <span className="text-base sm:text-lg font-bold text-blue-800">
                  {employeeCount}
                </span>
              )}
              <span className="text-xs sm:text-sm text-gray-600">
                employees
              </span>
            </div>
          </div>

          {/* Pricing Tiers List */}
          <div className="mb-3 sm:mb-4">
            <h4 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 text-center">
              Pricing Tiers:
            </h4>
            <div className="space-y-1 sm:space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
              {pricingTiers.map((tier, index) => {
                const isCurrentTier =
                  employeeCount >= tier.min && employeeCount <= tier.max
                return (
                  <div
                    key={index}
                    className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 rounded-lg shadow-sm text-xs sm:text-sm ${
                      isCurrentTier
                        ? "bg-blue-100 border-2 border-blue-300"
                        : "bg-white"
                    }`}
                  >
                    <span
                      className={`${
                        isCurrentTier
                          ? "font-bold text-blue-800"
                          : "text-gray-700"
                      } mb-1 sm:mb-0`}
                    >
                      {tier.min.toLocaleString()}-{tier.max.toLocaleString()}{" "}
                      employees
                    </span>
                    <span
                      className={`${
                        isCurrentTier
                          ? "font-bold text-blue-800"
                          : "font-bold text-blue-800"
                      }`}
                    >
                      ${tier.price.toFixed(2)}/month per employee
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <button
          onClick={handleSubscribe}
          className="w-full bg-[#294494] text-white font-extrabold py-2 sm:py-3 rounded-xl text-sm sm:text-base hover:bg-blue-900 transition-colors shadow-md disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Redirecting..." : "Subscribe Now"}
        </button>

        <button
          onClick={() => signOut(() => router.push("/"))}
          className="w-full mt-3 bg-gray-200 text-gray-700 font-medium py-2 sm:py-3 rounded-xl text-sm sm:text-base hover:bg-gray-300 transition-colors shadow-sm"
        >
          Logout
        </button>

        {error && (
          <p className="text-red-500 mt-3 sm:mt-4 text-center text-xs sm:text-sm">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
