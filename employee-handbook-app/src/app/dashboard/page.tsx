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
  const [trialInfo, setTrialInfo] = useState<{
    isTrialPeriod?: boolean
    trialEndsAt?: string
  } | null>(null)

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
        const { subscribed, isTrialPeriod, trialEndsAt } = response.data;
        
        // Store trial information if user is in trial period
        if (isTrialPeriod) {
          setTrialInfo({ isTrialPeriod, trialEndsAt });
        }
        
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
      
      {/* Trial Banner */}
      {trialInfo?.isTrialPeriod && user?.unsafeMetadata?.userType !== 'Employee' && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Free Trial Active</p>
                <p className="text-sm opacity-90">
                  Your trial ends on {new Date(trialInfo.trialEndsAt!).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await axiosInstance.post('/api/stripe/checkout');
                  router.push(res.data.url);
                } catch (err) {
                  console.error('Failed to start checkout session:', err);
                }
              }}
              className="bg-white text-blue-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

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
