/* eslint-disable */

"use client"

import { useEffect, useState, Dispatch, SetStateAction, useRef } from "react"
import Link from "next/link"
import { Plus, Menu, Trash2 } from "lucide-react"
import axiosInstance from "./axios_config"
import { useRouter } from "next/navigation"
import { useUser, UserButton } from "@clerk/nextjs"
import { Message } from "../models/schema"
import { marked } from "marked"
import { Fragment } from "react"
import {
  Listbox,
  Label,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react"
import { ChevronDown, Check } from "lucide-react"
import dynamic from "next/dynamic"

const ERROR_MESSAGE = "Oops, something went wrong. Want to try again?"

const InputMessage = dynamic(
  () => import("./MessageInput").then((mod) => mod.MessageInput),
  {
    ssr: false,
  }
)

// for converting the abbreviated province stored in local storage for private users to the full province name
export const provinceMap: { [key: string]: string } = {
  ON: "Ontario",
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  NT: "Northwest Territories",
  NU: "Nunavut",
  YT: "Yukon",
}

function generateThreadId(): string {
  return Date.now().toString()
}

export interface Chat {
  id: string
  title: string
}

interface PrivateChat {
  id: string
  title: string
  needsTitleUpdate?: boolean
}

export interface PublicChat {
  id: string
  title: string
  messages?: Message[]
  needsTitleUpdate?: boolean
}

function getRowClass(i: number, total: number) {
  if (total >= 3) {
    return i % 2 === 0 ? "bg-white" : "bg-gray-200"
  }
  return "bg-white border border-gray-200"
}

export function markdownListToTable(md: string): string {
  const renderer = new marked.Renderer()

  renderer.list = function (token: any) {
    const listItems = token.items.map((item: any) => {
      return marked.parser(item.tokens)
    })

    const rows = listItems
      .map(
        (item: string, i: number) =>
          `<tr class="${getRowClass(
            i,
            listItems.length
          )}"><td class="px-4 py-2">${item}</td></tr>`
      )
      .join("")

    return `
    <div class="w-full border border-gray-200 rounded-lg overflow-hidden my-4">
      <table class="w-full">
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    `
  }

  const result = marked.parse(md, { renderer })
  if (typeof result === "string") {
    return result
  }

  throw new Error("marked.parse returned a Promise, but a string was expected.")
}

function PublicChatSideBar({
  setMessages,
  setCurrChatId,
  currChatId,
  chats,
  setChats,
  titleLoading,
}: {
  setMessages: Dispatch<SetStateAction<Message[]>>
  setCurrChatId: (chatId: string) => void
  currChatId: string
  chats: PublicChat[]
  setChats: Dispatch<SetStateAction<PublicChat[]>>
  titleLoading: boolean
}) {
  // Add collapsed state
  const [isCollapsed, setIsCollapsed] = useState(false)

  const selectChat = (chat: PublicChat) => {
    setCurrChatId(chat.id)
    setMessages(chat.messages || [])
  }

  const handleNewChat = () => {
    const newChat: PublicChat = {
      id: generateThreadId(),
      title: `Chat - ${new Date().toLocaleDateString()}-${chats.length + 1}`,
      messages: [],
      needsTitleUpdate: true,
    }
    const updatedChats = [newChat, ...chats]
    setChats(updatedChats)
    setCurrChatId(newChat.id)
    setMessages([])
  }

  const handleDelete = (id: string) => {
    const updatedChats = chats.filter((c) => c.id !== id)
    setChats(updatedChats)
    if (currChatId === id) {
      setCurrChatId("")
      setMessages([])
    }
  }

  return (
    <aside
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } h-screen bg-[#1F2251] text-white flex flex-col min-h-screen relative transition-all duration-300`}
    >
      <div className="relative flex p-5 w-full">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle sidebar"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Menu />
        </button>
      </div>
      {!isCollapsed && (
        <>
          <div className="px-4 text-sm text-gray-300 mb-2">Today</div>
          {chats.map((chat, index) => (
            <button
              key={`${chat.id}-${index}`}
              className={`bg-[#343769] text-white text-left px-4 py-2 mx-4 rounded-lg hover:bg-[#45488f] ${
                currChatId === chat.id ? "border border-blue-300" : ""
              }`}
              onClick={() => selectChat(chat)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {titleLoading && currChatId === chat.id
                    ? "Generating Title..."
                    : chat.title}
                </span>
                {currChatId === chat.id && (
                  <Trash2
                    className="text-gray-400"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(chat.id)
                    }}
                  />
                )}
              </div>
            </button>
          ))}

          <button className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full p-2 hover:bg-gray-400">
            <Plus className="text-[#1F2251]" onClick={handleNewChat} />
          </button>
        </>
      )}
    </aside>
  )
}

function PrivateChatSideBar({
  setMessages,
  setCurrChatId,
  currChatId,
  titleLoading,
  chats,
  setChats,
  totalChatsLength,
  setTotalChatsLength,
}: {
  setMessages: Dispatch<SetStateAction<Message[]>>
  setCurrChatId: (chatId: string) => void
  currChatId: string
  titleLoading: boolean
  chats: PrivateChat[]
  setChats: Dispatch<SetStateAction<PrivateChat[]>>
  totalChatsLength: number
  setTotalChatsLength: Dispatch<SetStateAction<number>>
}) {
  const [selectedChat, setSelectedChat] = useState<PrivateChat | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [showPopup, setShowPopup] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  // Add collapsed state
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("hideChatWarning")
    if (stored === "true") {
      setDontShowAgain(true)
    }
  }, [])

  useEffect(() => {
    const localUserId = localStorage.getItem("userId")
    if (localUserId) {
      axiosInstance
        .get(`/api/chat/${localUserId}?isUserID=true`)
        .then((response) => {
          const chatData = response.data.map((chat: any) => ({
            id: chat.id,
            title: chat.title,
            needsTitleUpdate: chat.title && chat.title.startsWith("Chat - "),
          }))
          setChats(chatData.slice(0, 8)) // Limit to 8 chats
          setTotalChatsLength(chatData.length)
          setSelectedChat(
            chatData.find((chat: PrivateChat) => chat.id === currChatId) || null
          )
        })
    }
  }, [currChatId])

  useEffect(() => {
    async function fetchChats() {
      const localUserId = localStorage.getItem("userId")
      setUserId(localUserId)
      const allChats = await axiosInstance.get(
        `/api/chat/${localUserId}?isUserID=true`
      )
      const chatData = allChats.data.map((chat: any) => ({
        id: chat.id,
        title: chat.title,
        needsTitleUpdate: chat.title && chat.title.startsWith("Chat - "),
      }))
      setChats(chatData.slice(0, 8))
      setTotalChatsLength(chatData.length)
      if (chatData.length > 0) {
        setSelectedChat(chatData[0])
        // Fetch messages for the first chat
        const firstChatMessages = await axiosInstance.get(
          `/api/chat/${chatData[0].id}`
        )
        setMessages(firstChatMessages.data.messages)
        setCurrChatId(chatData[0].id)
      }
    }

    fetchChats()
  }, [])

  async function handleChatChange(currChat: PrivateChat) {
    setSelectedChat(currChat)
    const currMessages = await axiosInstance.get(`/api/chat/${currChat.id}`)
    setMessages(currMessages.data.messages)
    setCurrChatId(currChat.id)
  }

  async function handleNewChat() {
    if (!userId) return

    const newChat = {
      title: `Chat - ${new Date().toLocaleDateString()}-${
        totalChatsLength + 1
      }`,
      userId: userId,
      messages: [] as Message[],
      needsTitleUpdate: true, // <-- add this flag
    }

    try {
      const response = await axiosInstance.post("/api/chat", newChat)
      const createdChat = response.data
      console.log("New chat created:", createdChat)
      setChats([
        { id: createdChat.id, title: newChat.title, needsTitleUpdate: true },
        ...chats.slice(0, 7),
      ])
      setSelectedChat({
        id: createdChat.id,
        title: newChat.title,
        needsTitleUpdate: true,
      })
      setMessages(newChat.messages || [])
      setCurrChatId(createdChat.id)
      // Removed AI title generation here; will be handled after first message in InputMessage
    } catch (error) {
      console.error("Error creating new chat:", error)
    }
  }

  const showChatWarningPopup = () => {
    if (!dontShowAgain && chats.length >= 8) {
      setShowPopup(true)
      return
    } else {
      handleNewChat()
    }
  }

  const closePopup = () => {
    setShowPopup(false)
  }

  const handleConfirmNewChat = () => {
    setShowPopup(false)
    handleNewChat()
  }

  const handleDoNotShowAgain = () => {
    localStorage.setItem("hideChatWarning", "true")
    setDontShowAgain(true)
  }

  return (
    <aside
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-[#1F2251] text-white flex flex-col min-h-screen relative transition-all duration-300`}
    >
      <div className="relative flex p-5 w-full">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle sidebar"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Menu />
        </button>
      </div>
      {!isCollapsed && (
        <>
          <div className="px-4 text-sm text-gray-300 mb-2">Today</div>
          <div className="flex flex-col mb-20 space-y-2">
            {chats.map((chat, index) => (
              <button
                key={`${chat.id}-${index}`}
                className="bg-[#343769] text-white text-left px-4 py-2 mx-4 rounded-lg hover:bg-[#45488f] text-sm sm:text-base"
                onClick={() => {
                  handleChatChange(chat)
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {titleLoading && selectedChat?.id === chat.id
                      ? "Generating Title..."
                      : chat.title}
                  </span>
                  {selectedChat?.id === chat.id && (
                    <Trash2
                      className="text-gray-400"
                      onClick={() => {
                        axiosInstance
                          .delete(`/api/chat/${chat.id}`)
                          .then(() => {
                            setChats(chats.filter((c) => c.id !== chat.id))
                            if (selectedChat?.id === chat.id) {
                              setSelectedChat(null)
                              setMessages([])
                              setCurrChatId("")
                            }
                          })
                          .catch((error) => {
                            console.error("Error deleting chat:", error)
                          })
                      }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* New Chat Button */}
      {!isCollapsed && (
        <button className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full p-2 hover:bg-gray-400">
          <Plus className="text-[#1F2251]" onClick={showChatWarningPopup} />
        </button>
      )}

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.2)] z-50 text-black">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold mb-2">Start New Chat</h2>
            <p className="mb-4">
              Only the 8 most recent chats will be shown. Older chats will be
              hidden.
            </p>

            <label className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={handleDoNotShowAgain}
              />
              <span>Don't show this again</span>
            </label>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closePopup}
                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNewChat}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Start New Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function PopularQuestions({
  setInputValue,
  province,
  messages,
  chatId,
}: {
  setInputValue: (inputValue: string) => void
  province: string
  messages: Message[]
  chatId: string
}) {
  const defaultQuestions = [
    "Do I get paid breaks?",
    "What is the minimum wage?",
    "Do I get sick days?",
  ]
  const empty = [""]
  const [questions, setQuestions] = useState<string[]>(empty)

  useEffect(() => {
    let isMounted = true

    const fetchPopular = async () => {
      try {
        const fullProvince =
          province.length == 2 ? provinceMap[province] : province

        const request = {
          company: localStorage.getItem("companyName") || "",
          province: fullProvince,
        }
        console.log("request", request)

        const response = await axiosInstance.post(
          "/api/popular-questions",
          request
        )
        let popularQuestions = response.data

        if (popularQuestions.length > 3) {
          popularQuestions = popularQuestions.slice(0, 3)
        }

        // if fewer than 3 popular questions are returned, fill the list by
        // adding default questions until there are 3
        const merged = [...popularQuestions]
        let i = 0
        while (merged.length < 3) {
          merged.push(defaultQuestions[i])
          i++
        }

        if (isMounted) {
          setQuestions(merged)
        }
      } catch (error) {
        console.error("Error retrieving popular questions", error)
      }
    }

    if (messages.length === 0) {
      fetchPopular()
    }

    return () => {
      isMounted = false
    }
  }, [province, chatId])

  return (
    <div className="flex flex-col sm:flex-row justify-center gap-4 pb-4">
      {JSON.stringify(questions) !== JSON.stringify(empty) && // only display questions after its updated with popular questions
        questions.map((q, i) => (
          <button
            key={i}
            onClick={() => setInputValue(q)}
            className="bg-blue-800 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            {q}
          </button>
        ))}
    </div>
  )
}

function MessageThread({
  messageList,
  error,
  chatId,
  onRetry,
}: {
  messageList: Message[]
  error: { message: string; chatId: string }
  chatId: string
  onRetry?: () => void
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messageList, error])

  const handleRetry = () => {
    if (onRetry) onRetry()
  }

  return (
    <div
      className="flex flex-1 flex-col gap-6 py-6 px-1 overflow-y-auto"
      style={{ maxHeight: "calc(100vh - 130px)" }}
    >
      {messageList.length === 0 ? (
        <div className="flex flex-col justify-center items-center text-center pt-70">
          <h2 className="text-5xl font-bold text-blue-800 mb-2">
            Welcome to Gail!
          </h2>
          <h3 className="text-xl font-medium text-blue-800">
            Your workplace rights & regulations chatbot
          </h3>
        </div>
      ) : (
        messageList.map((message, index) => (
          <div key={index} className="flex flex-col">
            {message.isFromUser ? (
              <div className="self-end bg-blue-100 text-gray-800 p-4 rounded-md max-w-[70%] shadow-sm text-lg">
                {message.content
                  .split("\n")
                  .map((line, idx) =>
                    line === "" ? <br key={idx} /> : <p key={idx}>{line}</p>
                  )}
              </div>
            ) : (
              <div className="self-start bg-gray-100 text-gray-800 p-4 rounded-md max-w-[70%] shadow-sm">
                <div
                  className="text-lg"
                  dangerouslySetInnerHTML={{
                    __html: markdownListToTable(message.content),
                  }}
                />
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2">
                    {message.sources
                      .filter((link) => link.url)
                      .map((link, linkIndex) => (
                        <a
                          key={`${index}-${linkIndex}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-800 underline font-medium hover:text-blue-600 transition w-fit"
                        >
                          {link.title?.trim() || "View PDF Source"}
                        </a>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {error.message && error.chatId === chatId && (
        <div className="self-start border border-red-500 bg-red-200 text-gray-800 p-4 rounded-md max-w-[70%] shadow-sm text-lg">
          <div>{error.message}</div>
          <div className="pt-4">
            <button
              onClick={handleRetry}
              className="border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-md bg-white hover:bg-gray-200 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="py-10" />
    </div>
  )
}


function Header({
  province,
  setProvince,
  showHeader = true
}: {
  province: string
  setProvince: (prov: string) => void,
  showHeader?: boolean
}) {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [isFinance, setIsFinance] = useState(false)
  const [canSeeDashboard, setCanSeeDashboard] = useState(false)
  const [isOnDashboard, setIsOnDashboard] = useState(false)
  const [companyName, setCompanyName] = useState<string | null>(null)
  // const isFinance = true


function checkAuthentication(isSignedIn: boolean, canSeeDashboard: boolean) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
   if (pathname === "/dashboard") {
      if (!isSignedIn) {
        router.push("/")
      }
      else if(!canSeeDashboard) {
        router.push("/chat")
      }
    }

    else if (pathname === "/finances") {
      if (!isSignedIn) {
        router.push("/")
      }
    }
    else if (pathname === "/analytics") {
      if (!isSignedIn) {
        router.push("/")
      }
      else if (!canSeeDashboard) {
        router.push("/chat")
      }
    }
  }

  useEffect(() => {
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    if (isSignedIn && user) {
      setIsOnDashboard(pathname === "/dashboard")
      axiosInstance
        .get(`/api/users/${user.id}?isClerkID=true`)
        .then((response) => {
          console.log("response.data in header: ", response.data)
          let userId = response.data[0].id
          localStorage.setItem("userId", userId)
          localStorage.setItem("companyId", response.data[0].companyId || "")
          localStorage.setItem("companyName", response.data[0].companyName || "")
          setCompanyName(response.data[0].companyName || null)
          setProvince(response.data[0].province || "")
          setIsFinance(response.data[0].userType == "Financer")
          setCanSeeDashboard(
            response.data[0].userType == "Owner" ||
              response.data[0].userType == "Administrator"
          )

          checkAuthentication(true, response.data[0].userType == "Owner" || response.data[0].userType == "Administrator")
        })
        .catch((error) => {
          console.error("Error fetching user data:", error)
        })
    } else if (isSignedIn !== undefined) {
      localStorage.removeItem("userId")
      localStorage.removeItem("companyId")
      localStorage.removeItem("companyName")
      checkAuthentication(false, false)
      setCompanyName(null)
    }

  }, [isSignedIn, user])

  if (!showHeader) {
    return null
  }

  return (
    <header className="flex justify-between items-center px-6 py-4">
      <div className="flex items-center gap-4">
        {!isSignedIn || !canSeeDashboard ? (
          <h1 className="text-2xl font-extrabold italic text-blue-800 cursor-pointer">
            Gail
          </h1>
        ) : (
          <Link href="/dashboard">
            <h1 className="text-2xl font-extrabold italic text-blue-800 cursor-pointer">
              Gail
            </h1>
          </Link>
        )}
        {companyName && (
          <span className="text-lg font-medium text-black hidden md:block">
            | {companyName}
          </span>
        )}
      </div>
      <div className="flex gap-4 items-center">
        {canSeeDashboard && !isOnDashboard && isSignedIn &&(
          <>
            <button
              className="px-5 py-2 bg-blue-800 text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </button>
          </>
        )}
        {isSignedIn && isOnDashboard && (
          <button
            className="px-5 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm"
            onClick={() => router.push("/chat")}
          >
            Ask a Question
          </button>
        )}
        {(isFinance || canSeeDashboard) && isSignedIn && (
          <>
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
          </>
        )}

        <div className="flex gap-3 items-center">
          {!isSignedIn ? (
            <>
              <span className="px-4">
                <ProvinceDropdown
                  province={province}
                  setProvince={setProvince}
                />
              </span>
              <LogIn />
              <SignUp />
            </>
          ) : (
            <div className="flex items-center">
              <span className="px-4">
                <ProvinceDropdown
                  province={province}
                  setProvince={setProvince}
                />
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export function LogIn() {
  const router = useRouter()

  const handleLogin = () => {
    router.push("/log-in/[...rest]")
  }

  return (
    <button
      onClick={handleLogin}
      className="bg-blue-800 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
    >
      Log in
    </button>
  )
}

function SignUp() {
  const router = useRouter()

  const handleSignUp = () => {
    router.push("/sign-up")
  }

  return (
    <button
      onClick={handleSignUp}
      className="border border-gray-300 text-gray-700 font-semibold px-6 py-2 rounded-md hover:bg-gray-200 transition-colors"
    >
      Sign up
    </button>
  )
}

function ProvinceDropdown({
  province,
  setProvince,
}: {
  province: string
  setProvince: (prov: string) => void
}) {
  const provinces = [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
  ] as const

  return (
    <Listbox value={province} onChange={setProvince}>
      <div className="relative inline-block">
        <Label className="sr-only">Change province or territory</Label>

        <ListboxButton className="w-[290px] px-4 py-2 flex items-center rounded-md bg-white font-semibold border border-gray-300 text-gray-700 hover:bg-gray-200 transition-colors">
          Change your province/territory
          <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
        </ListboxButton>

        <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-[270px] overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/10">
          {provinces.map((p) => (
            <ListboxOption key={p} value={p} as={Fragment}>
              {({
                active,
                selected,
              }: {
                active: boolean
                selected: boolean
              }) => (
                <li
                  className={
                    `flex cursor-pointer select-none items-center gap-2 px-4 py-2 text-sm ` +
                    (active ? "bg-blue-100 text-blue-900" : "text-gray-900")
                  }
                >
                  <span className="flex-1">{p}</span>
                  {selected && <Check className="h-4 w-4" />}
                </li>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}

function Disclaimer() {
  return (
    <p className="text-center text-sm text-gray-500 mt-4">
       © Copyright 2025, Analana Inc. All rights reserved. GAIL can make mistakes, please verify your results.
    </p>
  )
}

export {
  PrivateChatSideBar,
  PublicChatSideBar,
  PopularQuestions,
  MessageThread,
  InputMessage,
  Header,
  Disclaimer,
  generateThreadId,
  ERROR_MESSAGE,
}