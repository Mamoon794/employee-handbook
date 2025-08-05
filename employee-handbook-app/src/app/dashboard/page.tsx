/* eslint-disable */
"use client"

import { useRouter } from "next/navigation"
import { useUser, useAuth, useSessionList } from "@clerk/nextjs"
import { useEffect, useState, useCallback } from "react"
import axiosInstance from "../axios_config"
import PaywallModal from "../../../components/paywall-popup"
import { Header } from "../global_components"
import { CircularProgress } from "@mui/material"
import { TrashIcon } from "lucide-react"
import FreeTrialModal from "@/components/free-trial-popup"

type pdfFile = {
  name: string
  type: string
  url: string
}

type CustProps = {
  files: pdfFile[]
  setFiles: React.Dispatch<React.SetStateAction<pdfFile[]>>
}

const FilePreview: React.FC<CustProps> = ({ files, setFiles }) => {
  const handleOpen = (file: pdfFile) => {
    window.open(file.url, "_blank", "noopener,noreferrer")
  }

  async function handleDelete(file: pdfFile, index: number) {
    try {
      await axiosInstance.delete("/api/company/docs", {
        data: {
          companyId: localStorage.getItem("companyId"),
          index: index,
        },
      })
      setFiles(files.filter((_, i) => i !== index))

      // Also delete from vector DB
      const companyName = localStorage.getItem("companyName") || ""
      try {
        await axiosInstance.patch("/api/vectordb-documents/source", {
          url: file.url,
          company: companyName,
        })
      } catch (error) {
        console.error("Error deleting from vector DB:", error)
        alert("Failed to delete from vector DB. Please try again later.")
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      alert("Failed to delete file. Please try again later.")
    }
  }

  return (
    <div className="max-h-64 overflow-y-auto w-full space-y-2 mb-3">
      {files.map((file, index) => (
        <div
          key={index}
          className="flex items-center justify-between cursor-pointer p-4 border rounded hover:bg-gray-100"
        >
          <div onClick={() => handleOpen(file)} className="flex-1">
            <p className="text-blue-600">{file.name}</p>
          </div>
          <button
            onClick={() => handleDelete(file, index)}
            aria-label={`Delete ${file.name}`}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const { sessionId } = useAuth()
  const { sessions } = useSessionList()
  const firstName = user?.firstName || "there"
  const [showPaywall, setShowPaywall] = useState(false)
  const [showFreeTrialPopup, setShowFreeTrialPopup] = useState(false)
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [savedFiles, setSavedFiles] = useState<pdfFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [province, setProvince] = useState<string>("")
  const [trialInfo, setTrialInfo] = useState<{
    isTrialPeriod?: boolean
    trialEndsAt?: string
  } | null>(null)

  const fetchCompanyDocs = useCallback(async () => {
    const companyId = localStorage.getItem("companyId")
    if (!companyId) return
    const companyDocs = await axiosInstance.get(
      `/api/company/docs/${companyId}`
    )
    let get_files: pdfFile[] = []
    for (const doc of companyDocs.data.companyDocs) {
      get_files.push({
        name: doc.fileName,
        type: "application/pdf",
        url: doc.fileUrl,
      })
    }
    setSavedFiles(get_files)
  }, [])

  useEffect(() => {
    if (localStorage.getItem("companyId")) {
      fetchCompanyDocs()
    }
  }, [fetchCompanyDocs])

  useEffect(() => {
    // no user or no session info yet
    if (!isLoaded || !user || !sessions || !sessionId) return
    
    const userCreatedAt = user.createdAt;
    if (!userCreatedAt) return;

    const current = sessions.find(s => s.id === sessionId);
    const sessionCreatedAt = current?.createdAt;
    if (!sessionCreatedAt) return;

    const userTs = userCreatedAt.getTime();
    const sessionTs = sessionCreatedAt.getTime();
    
    // treat as “first login” if signup and login are within one minute
    setIsFirstLogin(Math.abs(sessionTs - userTs) < 60 * 1000);
  }, [isLoaded, user, sessions, sessionId])

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      const userType = user.unsafeMetadata?.userType as string

      if (userType === "Employee") {
        setShowPaywall(false)
        setShowFreeTrialPopup(false)
        setIsLoading(false)
        return
      }

      try {
        const response = await axiosInstance.get('/api/check-subscription');
        const { subscribed, isTrialPeriod, trialEndsAt } = response.data;
        
        // Store trial information if user is in trial period
        if (isTrialPeriod) {
          setTrialInfo({ isTrialPeriod, trialEndsAt });
          if (isFirstLogin) {
            setShowFreeTrialPopup(true)
          }
        } else {
          setShowPaywall(!subscribed);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking subscription status:", error)
        // If error occurs, show paywall as fallback for employers only
        setShowPaywall(userType !== "Employee")
        setIsLoading(false)
      }
    }

    checkSubscriptionStatus()
  }, [user])

  async function uploadDocuments(event: React.ChangeEvent<HTMLInputElement>) {
    const companyId = localStorage.getItem("companyId") || ""
    if (!companyId) {
      console.error("No companyId found")
      return
    }

    const companyName = localStorage.getItem("companyName") || ""

    const files = event.target.files || []
    setIsLoading(true)
    try {
      let documentData = []
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append("file", files[i])
        formData.append("bucketName", "employee-handbook-app")

        const s3res = await axiosInstance.post("/api/s3/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        const url = s3res.data.fileUrl
        savedFiles.push({
          name: files[i].name,
          type: files[i].type,
          url: url,
        })
        documentData.push({
          fileUrl: url,
          fileName: files[i].name,
          uploadDate: new Date(),
          isPublic: false,
        })

        const vdbres = await axiosInstance.post("/api/vectordb-documents", {
          fileurl: url,
          namespace: companyName,
        })

        if (vdbres.data.company_docs_len == 0) {
          alert(
            "No extractable text found. This PDF may be scanned or image-based. Please delete it and upload a version with selectable text."
          )
        }
      }
      setSavedFiles([...savedFiles])
      await axiosInstance.put("/api/company/docs", {
        companyId: localStorage.getItem("companyId"),
        documents: documentData,
      })
    } catch (error) {
      console.error("Error uploading documents:", error)
      alert("Failed to upload documents. Please try again later.")
    }
    setIsLoading(false)
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
      {trialInfo?.isTrialPeriod && !isFirstLogin && user?.unsafeMetadata?.userType !== 'Employee' && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Free Trial Active</p>
                <p className="text-sm opacity-90">
                  {(() => {
                    const today = new Date();
                    const trialEnd = new Date(trialInfo.trialEndsAt!);
                    const diffTime = trialEnd.getTime() - today.getTime();
                    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    return `You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining in your trial. Trial ends on ${trialEnd.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}`;
                  })()}
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
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-24 px-4 sm:px-6 lg:px-8 py-8 lg:py-16 w-full max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md lg:max-w-none">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-blue-800 mb-6 lg:mb-8 text-center px-4">
            Welcome, {firstName}!
          </h2>
          {savedFiles.length > 0 ? (
            <p className="text-base sm:text-lg text-black font-bold mb-8 lg:mb-12 text-center px-4">
              You have {savedFiles.length} files uploaded:
            </p>
          ) : (
            <p className="text-base sm:text-lg text-black font-bold mb-8 lg:mb-12 text-center px-4">
              It seems there are currently no files uploaded.
            </p>
          )}
          <FilePreview files={savedFiles} setFiles={setSavedFiles} />
          {isLoading ? (
            <CircularProgress />
          ) : (
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
          )}
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
      <footer className="w-full h-24 bg-[#294494] mt-auto flex items-center justify-center px-4">
        <p className="text-center text-sm text-white">
          © Copyright 2025, Analana Inc. All rights reserved. GAIL can make mistakes, please verify your results.
        </p>
      </footer>

      {/* Paywall Modal */}
      {showPaywall && <PaywallModal />}

      {/* Free Trial Modal */}
      {showFreeTrialPopup && <FreeTrialModal trialEndsAt={trialInfo?.trialEndsAt} onClose={() => setShowFreeTrialPopup(false)}/>}
    </div>
  )
}
