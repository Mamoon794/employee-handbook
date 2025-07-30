"use client"

import { useRouter } from "next/navigation"
import { useUser, UserButton } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import axiosInstance from "../axios_config"
import PaywallModal from "../../../components/paywall-popup"

export default function Dashboard() {
  const router = useRouter()
  const { user } = useUser()
  const firstName = user?.firstName || "there"
  const [showPaywall, setShowPaywall] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const response = await axiosInstance.get("/api/check-subscription")
        const { subscribed } = response.data

        // Only show paywall if user is not subscribed
        setShowPaywall(!subscribed)
        setIsLoading(false)
      } catch (error) {
        console.error("Error checking subscription status:", error)
        // If error occurs, show paywall as fallback (safer approach)
        setShowPaywall(true)
        setIsLoading(false)
      }
    }

    checkSubscriptionStatus()
  }, [user])

  async function uploadDocuments(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files || []
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData()
      formData.append("file", files[i])
      formData.append("bucketName", "employee-handbook-app")

      await axiosInstance.post("/api/s3/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-blue-800">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 bg-white shadow-sm">
        <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
        <div className="flex gap-4 items-center">
          <button
            className="px-5 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm"
            onClick={() => {
              router.push("/chat")
            }}
          >
            Ask a Question
          </button>
          <button
            className="px-5 py-2 bg-blue-800 text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm"
            onClick={() => router.push("/finances")}
          >
            View Finances
          </button>
          <button
            onClick={() => router.push("/analytics")}
            className="px-5 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm"
          >
            Analytics
          </button>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-15 h-15",
              },
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-24 px-8 py-16 w-full max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-extrabold text-blue-800 mb-8 text-center">
            Welcome, {firstName}!
          </h2>
          <p className="text-lg text-black font-bold mb-12 text-center">
            It seems there are currently no files uploaded.
          </p>
          <label className="bg-[#294494] text-white font-extrabold px-12 py-5 rounded-xl text-xl hover:bg-blue-900 transition-colors shadow-md cursor-pointer">
            Upload Documents
            <input
              type="file"
              name="file"
              accept=".pdf"
              multiple
              onChange={uploadDocuments}
              className="hidden"
            />
          </label>
        </div>
        {/* Employee Management Card */}
        <div className="w-full max-w-sm bg-[#f5f7fb] rounded-xl shadow-lg flex flex-col items-center py-12 px-8">
          <div className="text-xl font-bold text-black mb-10 text-center">
            Employee Management
          </div>
          <button
            className="w-full bg-[#e3e8f0] text-black font-extrabold py-4 rounded-xl mb-5 text-base hover:bg-[#d1d5db] transition-colors shadow-sm"
            onClick={() => router.push("/add-employee")}
          >
            Add Employees
          </button>
          <button
            className="w-full bg-[#e3e8f0] text-black font-extrabold py-4 rounded-xl text-base hover:bg-[#d1d5db] transition-colors shadow-sm"
            onClick={() => router.push("/manage-employees")}
          >
            Manage Employees
          </button>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="w-full h-24 bg-[#294494] mt-auto" />

      {/* Paywall Modal */}
      {showPaywall && <PaywallModal />}
    </div>
  )
}
