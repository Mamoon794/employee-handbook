/* eslint-disable react/no-unescaped-entities */
// finishing page for employee registration >> creates user in db

"use client"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import type { UserType, User } from "@/models/schema"
import axiosInstance from "@/app/axios_config"

export default function EmployeeRegistrationForm() {
  const { user: clerkUser } = useUser()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    province: "Ontario",
    isSubscribed: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      if (!clerkUser) throw new Error("User not authenticated")
      if (!clerkUser.primaryEmailAddress?.emailAddress)
        throw new Error("Email not found")
      if (!clerkUser.firstName || !clerkUser.lastName)
        throw new Error("Name information missing")

      const userData: Omit<User, "id"> = {
        clerkUserId: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        email: clerkUser.primaryEmailAddress.emailAddress,
        userType: "Employee" as UserType,
        isSubscribed: formData.isSubscribed,
        province: formData.province,
        //companyId: companyRef.id,
        //companyName: formData.companyName,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await axiosInstance.post("/api/users", userData)

      await clerkUser.update({
        unsafeMetadata: {
          role: "Employee",
          //companyId: companyRef.id,
          //companyName: formData.companyName,
          province: formData.province,
          userType: "Employee",
        },
      })

      router.push("/chat")
    } catch (err) {
      console.error("Detailed registration error:", err) // debugging
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!clerkUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900">Loading your account information...</p>
          <p className="text-sm text-gray-500 mt-2">
            You'll be redirected automatically once ready
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 mr-2"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl sm:text-2xl font-extrabold italic text-blue-800">Gail</h1>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* left  */}
          <div className="lg:w-1/2 w-full">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Account Information
              </h2>
              <div className="p-4 sm:p-6 bg-gray-50 rounded-lg space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={clerkUser.firstName || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-gray-900 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={clerkUser.lastName || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-gray-900 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clerkUser.primaryEmailAddress?.emailAddress || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-gray-900 text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* right */}
          <div className="lg:w-1/2 w-full">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Just a few more details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province of Operation *
                </label>
                <select
                  value={formData.province}
                  onChange={(e) =>
                    setFormData({ ...formData, province: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm sm:text-base"
                  required
                >
                  <option value="Alberta">Alberta</option>
                  <option value="British Columbia">British Columbia</option>
                  <option value="Manitoba">Manitoba</option>
                  <option value="New Brunswick">New Brunswick</option>
                  <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                  <option value="Nova Scotia">Nova Scotia</option>
                  <option value="Ontario">Ontario</option>
                  <option value="Prince Edward Island">Prince Edward Island</option>
                  <option value="Quebec">Quebec</option>
                  <option value="Saskatchewan">Saskatchewan</option>
                  <option value="Yukon">Yukon</option>
                  <option value="Northwest Territories">Northwest Territories</option>
                  <option value="Nunavut">Nunavut</option>
                  <option value="Saskatchewan">Saskatchewan</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-800 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Completing Registration...
                    </span>
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Registration Error
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
