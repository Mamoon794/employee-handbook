/* eslint-disable */

// Allows owners to add employees, now with the ability to sort through pending, accepted, and expired
// invites. Owners can also 'cancel' a pending invite and it will appear as expired, so they can resend.

"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { FaEnvelope, FaCheckCircle, FaTrashAlt } from "react-icons/fa"
import { Header } from "../global_components"

interface PendingInvite {
  id: string
  email: string
  createdAt: Date
  status: "pending" | "expired" | "accepted"
}

interface ApiInvite {
  id: string
  email: string
  status?: "pending" | "expired" | "accepted"
  createdAt?: Date | { toDate?: () => Date } | string
}

type InvitationTab = 'pending' | 'expired' | 'accepted';

function AddEmployeeContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<InvitationTab>('pending');
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState("")
  const [formData, setFormData] = useState({ email: "" })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [acceptedInvites, setAcceptedInvites] = useState<PendingInvite[]>([])
  const [isLoadingInvites, setIsLoadingInvites] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [province, setProvince] = useState<string>("")

  useEffect(() => {
    const storedCompanyId = localStorage.getItem("companyId")
    const storedCompanyName = localStorage.getItem("companyName")
    if (storedCompanyId || storedCompanyName) {
      setCompanyId(storedCompanyId)
      setCompanyName(storedCompanyName)
    }
  }, [])

  const parseInviteDate = (dateInput: Date | { toDate?: () => Date } | string | undefined): Date => {
    if (!dateInput) return new Date()
    
    if (dateInput instanceof Date) {
      return dateInput
    }

    if (typeof dateInput === 'string') {
      const parsedDate = new Date(dateInput)
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate
    }

    if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
      return dateInput.toDate()
    }

    return new Date()
  }

  useEffect(() => {
    if (!companyId) return

    const fetchAllInvites = async () => {
      try {
        setIsLoadingInvites(true)
        
        const pendingResponse = await fetch(`/api/get-pending-invites?companyId=${companyId}`)
        if (!pendingResponse.ok) throw new Error("Failed to fetch pending invites")
        const pendingData = await pendingResponse.json()
        const pendingFormatted = pendingData.map((invite: ApiInvite) => ({
          id: invite.id,
          email: invite.email,
          status: invite.status || "pending",
          createdAt: parseInviteDate(invite.createdAt)
        }))
        
        const acceptedResponse = await fetch(`/api/get-accepted-invites?companyId=${companyId}`)
        if (!acceptedResponse.ok) throw new Error("Failed to fetch accepted invites")
        const acceptedData = await acceptedResponse.json()
        const acceptedFormatted = acceptedData.map((invite: ApiInvite) => ({
          id: invite.id,
          email: invite.email,
          status: "accepted",
          createdAt: parseInviteDate(invite.createdAt)
        }))
        
        setPendingInvites(pendingFormatted)
        setAcceptedInvites(acceptedFormatted)
      } catch (error) {
        console.error("Error fetching invites:", error)
        setError("Failed to load invites")
      } finally {
        setIsLoadingInvites(false)
      }
    }

    fetchAllInvites()
  }, [companyId])

  const formatDate = (date: Date) => {
    try {
      return isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
    } catch {
      return "Date unavailable"
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !companyName) {
      setError("Company information is missing")
      return
    }

    const isAlreadyInvited = pendingInvites.some(
      (invite) => invite.email.toLowerCase() === formData.email.toLowerCase() && invite.status === "pending"
    )

    if (isAlreadyInvited) {
      setError("Invite already sent to this email.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const user = localStorage.getItem("userId")
      const response = await fetch("/api/send-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          companyId: companyId,
          companyName: companyName,
          userId: user,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to send invitation")

      setConfirmedEmail(formData.email)
      setShowConfirmation(true)
      setFormData({ email: "" })
      
      // refresh 
      const pendingResponse = await fetch(`/api/get-pending-invites?companyId=${companyId}`)
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingInvites(pendingData.map((invite: ApiInvite) => ({
          id: invite.id,
          email: invite.email,
          status: invite.status || "pending",
          createdAt: parseInviteDate(invite.createdAt)
        })))
      }

      const acceptedResponse = await fetch(`/api/get-accepted-invites?companyId=${companyId}`)
      if (acceptedResponse.ok) {
        const acceptedData = await acceptedResponse.json()
        setAcceptedInvites(acceptedData.map((invite: ApiInvite) => ({
          id: invite.id,
          email: invite.email,
          status: "accepted",
          createdAt: parseInviteDate(invite.createdAt)
        })))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      const response = await fetch('/api/expire-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId: inviteId }),
      })

      if (!response.ok) throw new Error('Failed to delete invitation')

      // refresh
      const pendingResponse = await fetch(`/api/get-pending-invites?companyId=${companyId}`)
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingInvites(pendingData.map((invite: ApiInvite) => ({
          id: invite.id,
          email: invite.email,
          status: invite.status || "pending",
          createdAt: parseInviteDate(invite.createdAt)
        })))
      }
    } catch (error) {
      console.error('Error deleting invitation:', error)
      setError('Failed to delete invitation')
    }
  }

  const handleAddAnother = () => {
    setShowConfirmation(false)
    setConfirmedEmail("")
    setIsSubmitting(false)
  }

  const handleCancel = () => router.push("/dashboard")

  const filteredInvites = () => {
    switch (activeTab) {
      case 'pending': return pendingInvites.filter(invite => invite.status === 'pending')
      case 'expired': return pendingInvites.filter(invite => invite.status === 'expired')
      case 'accepted': return acceptedInvites
      default: return []
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header province={province} setProvince={setProvince} />

      <main className="flex-1 flex flex-col items-center py-6 sm:py-8 px-4 sm:px-6">
        <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {showConfirmation ? (
            <div className="bg-[#f5f7fb] p-4 sm:p-6 lg:p-8 rounded-2xl shadow-sm text-center border border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">
                Invitation Sent!
              </h2>
              <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-700">
                An invitation has been sent to{" "}
                <span className="font-bold text-blue-800">{confirmedEmail}</span>.
                They'll need to accept it before joining your company.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                <button
                  onClick={handleAddAnother}
                  className="bg-blue-800 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  Add Another Employee
                </button>
                <button
                  onClick={handleCancel}
                  className="border border-gray-300 px-4 sm:px-6 py-2 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#f5f7fb] p-4 sm:p-6 rounded-2xl shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-800 text-center">
                Add New Employee
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Employee Email:
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="employee@example.com"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="border border-gray-300 px-4 sm:px-6 py-2 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-800 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Invitation"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-[#f5f7fb] p-4 sm:p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-800">
                <span className="flex items-center gap-2">
                  <FaEnvelope className="text-blue-600" />
                  Invitations
                </span>
              </h3>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                {(['pending', 'expired', 'accepted'] as InvitationTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-sm font-medium ${
                      activeTab === tab
                        ? 'bg-blue-800 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[calc(100vh-500px)] min-h-[200px] max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg bg-white flex flex-col">
              {isLoadingInvites ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  Loading invitations...
                </div>
              ) : filteredInvites().length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  No {activeTab} invitations
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {filteredInvites().map((invite) => (
                    <div
                      key={invite.id}
                      className={`p-3 rounded-lg border ${
                        invite.status === "expired"
                          ? "bg-gray-100 border-gray-300"
                          : invite.status === "accepted"
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium text-sm ${
                            invite.status === "expired" 
                              ? "text-gray-600" 
                              : invite.status === "accepted"
                              ? "text-green-800"
                              : "text-gray-800"
                          }`}>
                            {invite.email}
                          </p>
                          <p className={`text-xs mt-1 ${
                            invite.status === "expired" 
                              ? "text-gray-400" 
                              : invite.status === "accepted"
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}>
                            Sent: {formatDate(invite.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {invite.status === "expired" ? (
                            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                              EXPIRED
                            </span>
                          ) : invite.status === "accepted" ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <FaCheckCircle className="text-green-600" />
                              ACCEPTED
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteInvite(invite.id);
                              }}
                              className="text-gray-500 hover:text-red-500 transition-colors"
                              title="Delete invitation"
                            >
                              <FaTrashAlt className="text-sm" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full h-24 bg-[#294494] mt-auto flex items-center justify-center px-4">
        <p className="text-center text-sm text-white">
          © Copyright 2025, Analana Inc. All rights reserved. GAIL can make mistakes, please verify your results.
        </p>
      </footer>
    </div>
  )
}

export default function AddEmployeePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-pulse text-blue-800">
            Loading employee data...
          </div>
        </div>
      }
    >
      <AddEmployeeContent />
    </Suspense>
  )
}