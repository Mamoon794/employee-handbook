"use client"

import { useRouter } from "next/navigation"
import { FaTrashAlt } from "react-icons/fa"
import { UserButton, useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { User } from "@/models/schema"
import axiosInstance from "../axios_config"
import Link from "next/link"

const USER_TYPES = ["Employee", "Owner", "Administrator", "Financer"] as const

export default function ManageEmployees() {
  const router = useRouter()

  const [employees, setEmployees] = useState<User[]>([])
  // const [deletedPopup, setDeletedPopup] = useState<boolean>(false)
  // const [province, setProvince] = useState<string>("")
  const [role, setRole] = useState<string>("")
  const [companyId, setCompanyId] = useState<string>("")
  // const [companyName, setCompanyName] = useState<string>("")

  const { isSignedIn, user } = useUser()

  useEffect(() => {
    // console.log(isSignedIn)
    if (isSignedIn && user) {
      axiosInstance
        .get(`/api/users/${user.id}?isClerkID=true`)
        .then((response) => {
          setCompanyId(response.data[0].companyId || "")
          // setCompanyName(response.data[0].companyName || "")
          // setProvince(response.data[0].province || "")
          setRole(response.data[0].userType || "Employee")
        })
        .catch((error) => {
          console.error("Error fetching user data:", error)
        })
    } else {
      setCompanyId("")
      // setCompanyName("")
    }
  }, [isSignedIn, user])

  const fetchEmployees = async () => {
    axiosInstance
      .get(`/api/company/${companyId}/users`)
      .then((usersResponse) => setEmployees(usersResponse.data))
      .catch((err) => console.error("Error fetching employees:", err))
  }

  useEffect(() => {
    if (companyId) {
      fetchEmployees()
    }
  }, [companyId])

  const deleteEmployee = async (userId: string) => {
    const response = await axiosInstance.delete(`/api/users/${userId}`)
    if (response.status === 204) {
      // setDeletedPopup(true)
      fetchEmployees()
    } else {
      console.log(response.statusText)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await axiosInstance.patch(`/api/users/${userId}`, {
        userType: newRole,
      })
      if (response.status === 200) {
        fetchEmployees()
        if (user?.id === userId) {
          setRole(newRole)
        }
      }
    } catch (error) {
      console.error("Failed to update role:", error)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-white shadow-sm">
        <Link href="/dashboard">
          <h1 className="text-xl sm:text-2xl font-extrabold italic text-blue-800">Gail</h1>
        </Link>
        <div className="flex gap-2 sm:gap-4 items-center">
          <button
            className="px-3 sm:px-5 py-2 bg-[#242267] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-900 transition-colors shadow-sm"
            onClick={() => {
              router.push("/chat")
            }}
          >
            Ask a Question
          </button>
          <button
            className="px-3 sm:px-5 py-2 bg-blue-800 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-900 transition-colors shadow-sm hidden sm:block"
            onClick={() => router.push("/finances")}
          >
            View Finances
          </button>
          <button
            onClick={() => router.push("/analytics")}
            className="px-3 sm:px-5 py-2 bg-[#242267] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-900 transition-colors shadow-sm hidden sm:block"
          >
            Analytics
          </button>
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 sm:w-10 sm:h-10" } }} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-8 sm:py-12 lg:py-20 px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-6 sm:mb-8 lg:mb-10 text-center">
          Manage your employees
        </h2>

        <div className="w-full max-w-4xl max-h-96 sm:max-h-120 bg-[#f5f7fb] p-4 sm:p-6 lg:p-8 rounded-2xl shadow-sm flex flex-col gap-3 sm:gap-4 overflow-y-auto">
          {employees.map((emp, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex-1 flex items-stretch w-full bg-white rounded-xl">
                {role === "Owner" ? (
                  <select
                    className="px-10 py-2 w-1/2 bg-[#4e65a4] text-white rounded-xl text-lg font-semibold flex text-center"
                    value={emp.userType}
                    onChange={(e) =>
                      handleRoleChange(emp.clerkUserId, e.target.value)
                    }
                  >
                    {USER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="px-10 py-2 w-1/2 bg-[#4e65a4] text-white rounded-xl text-lg font-semibold flex items-center justify-center">
                    {emp.userType}
                  </span>
                )}
                <div className="w-1/2 flex items-center px-8 py-2 relative">
                  <span className="text-xl font-bold text-black break-words flex-1 text-center">
                    {emp.firstName + " " + emp.lastName}
                  </span>
                  {user?.id !== emp.clerkUserId &&
                    (role === "Owner" || role === "Administrator") && (
                      <button
                        className="absolute right-3 ml-3 text-lg text-black bg-white border border-gray-300 rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-100"
                        onClick={() => deleteEmployee(emp.clerkUserId)}
                        title="Remove employee"
                      >
                        <FaTrashAlt />
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="mt-6 sm:mt-8 lg:mt-10 px-6 sm:px-8 lg:px-10 py-2 sm:py-3 bg-[#294494] text-white rounded-xl font-bold text-base sm:text-lg lg:text-xl"
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </button>
      </main>

      <footer className="w-full h-24 bg-[#294494] mt-auto" />
    </div>
  )
}
