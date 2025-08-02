"use client"

import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import axiosInstance from "../axios_config"
import PaywallModal from "../../../components/paywall-popup"
import { Header } from "../global_components"

export default function Dashboard() {
  const router = useRouter()
  const { user } = useUser()
  const firstName = user?.firstName || "there"
  const [showPaywall, setShowPaywall] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [province, setProvince] = useState<string>("")

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      const userType = user.unsafeMetadata?.userType as string;
      
      if (userType === 'Employee') {
        setShowPaywall(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get('/api/check-subscription');
        const { subscribed } = response.data;
        
        setShowPaywall(!subscribed);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking subscription status:', error);
        // If error occurs, show paywall as fallback for employers only
        setShowPaywall(userType !== 'Employee');
        setIsLoading(false);
      }
    };

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
      <Header province={province} setProvince={setProvince} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-24 px-4 sm:px-6 lg:px-8 py-8 lg:py-16 w-full max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md lg:max-w-none">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-blue-800 mb-6 lg:mb-8 text-center px-4">
            Welcome, {firstName}!
          </h2>
          <p className="text-base sm:text-lg text-black font-bold mb-8 lg:mb-12 text-center px-4">
            It seems there are currently no files uploaded.
          </p>
          <label className="bg-[#294494] text-white font-extrabold px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 rounded-xl text-lg sm:text-xl hover:bg-blue-900 transition-colors shadow-md cursor-pointer w-full max-w-xs sm:max-w-sm text-center">
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
        <div className="w-full max-w-sm bg-[#f5f7fb] rounded-xl shadow-lg flex flex-col items-center py-8 sm:py-10 lg:py-12 px-6 sm:px-8 mt-8 lg:mt-0">
          <div className="text-lg sm:text-xl font-bold text-black mb-8 lg:mb-10 text-center">
            Employee Management
          </div>
          <button
            className="w-full bg-[#e3e8f0] text-black font-extrabold py-3 sm:py-4 rounded-xl mb-4 lg:mb-5 text-sm sm:text-base hover:bg-[#d1d5db] transition-colors shadow-sm"
            onClick={() => router.push("/add-employee")}
          >
            Add Employees
          </button>
          <button
            className="w-full bg-[#e3e8f0] text-black font-extrabold py-3 sm:py-4 rounded-xl text-sm sm:text-base hover:bg-[#d1d5db] transition-colors shadow-sm"
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
