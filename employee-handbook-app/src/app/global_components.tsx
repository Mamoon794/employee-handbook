/* eslint-disable */

"use client"

import { useEffect, useState, Dispatch, SetStateAction, useRef } from "react"
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

const InputMessage = dynamic(
  () => import("./MessageInput").then((mod) => mod.MessageInput),
  {
    ssr: false,
  }
)

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
}: {
  setMessages: Dispatch<SetStateAction<Message[]>>
  setCurrChatId: (chatId: string) => void
  currChatId: string
  chats: PublicChat[]
  setChats: Dispatch<SetStateAction<PublicChat[]>>
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const storedChats = localStorage.getItem("publicChats")
    if (storedChats) {
      try {
        setChats(JSON.parse(storedChats))
      } catch {
        setChats([])
      }
    }

    const storedChatId = localStorage.getItem("currPublicChatId")
    if (storedChatId) setCurrChatId(storedChatId)
  }, [])

  useEffect(() => {
    localStorage.setItem("publicChats", JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    if (currChatId) localStorage.setItem("currPublicChatId", currChatId)
  }, [currChatId])

  useEffect(() => {
    const stored = localStorage.getItem("publicChats")
    if (stored) {
      const parsed = JSON.parse(stored)
      const chat = parsed.find((c: any) => c.id === currChatId)
      if (chat) setMessages(chat.messages || [])
    }
  }, [currChatId])

  const selectChat = (chat: PublicChat) => {
    setCurrChatId(chat.id)
    setMessages(chat.messages || [])
    localStorage.setItem("currPublicChatId", chat.id)
  }

  const handleNewChat = () => {
    const newChat: PublicChat = {
      id: Date.now().toString(),
      title: `Chat - ${new Date().toLocaleDateString()}-${chats.length + 1}`,
      messages: [],
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
    <aside className="w-64 bg-[#1F2251] text-white flex flex-col min-h-screen relative">
      <div className="flex justify-between items-center p-4">
        <Menu className="text-gray-400" />
      </div>
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
            <span className="font-medium">{chat.title}</span>
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
  setTitleLoading,
  totalChatsLength,
  setTotalChatsLength,
}: {
  setMessages: Dispatch<SetStateAction<Message[]>>
  setCurrChatId: (chatId: string) => void
  currChatId: string
  titleLoading: boolean
  chats: PrivateChat[]
  setChats: Dispatch<SetStateAction<PrivateChat[]>>
  setTitleLoading: Dispatch<SetStateAction<boolean>>
  totalChatsLength: number
  setTotalChatsLength: Dispatch<SetStateAction<number>>
}) {
  const [selectedChat, setSelectedChat] = useState<PrivateChat | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [showPopup, setShowPopup] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

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
    <aside className="w-64 bg-[#1F2251] text-white flex flex-col min-h-screen relative">
      <div className="flex justify-between items-center p-4">
        <Menu className="text-gray-400" />
      </div>
      {/* Spacer to push chats to the bottom */}
      {/* <div className="flex-grow"></div> */}
      <div className="">
        <div className="px-4 text-sm text-gray-300 mb-2">Today</div>
        <div className="flex flex-col mb-20 space-y-2">
          {chats.map((chat, index) => (
            <button
              key={`${chat.id}-${index}`}
              className="bg-[#343769] text-white text-left px-4 py-2 mx-4 rounded-lg hover:bg-[#45488f] text-sm sm:text-base
"
              onClick={() => {
                handleChatChange(chat)
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {titleLoading && selectedChat?.id === chat.id
                    ? "Generating..."
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
      </div>

      {/* New Chat Button */}
      <button className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full p-2 hover:bg-gray-400">
        <Plus className="text-[#1F2251]" onClick={showChatWarningPopup} />
      </button>

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

function MessageThread({
  messageList,
  error,
}: {
  messageList: Message[]
  error: string
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messageList, error])

  const handleRetry = () => {
    // TODO
  }

  return (
    <div
      className={`flex flex-col gap-6 py-6 px-1 overflow-y-auto ${messageList.length == 0 ? "flex-1" : ""}`}
      style={{ height: "calc(100vh - 200px)" }}
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
                <p>{message.content}</p>
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

      {error && (
        <div className="self-start border border-red-500 bg-red-200 text-gray-800 p-4 rounded-md max-w-[70%] shadow-sm text-lg">
          <div>{error}</div>
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
}: {
  province: string
  setProvince: (prov: string) => void
}) {
  const { isSignedIn, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn && user) {
      axiosInstance
        .get(`/api/users/${user.id}?isClerkID=true`)
        .then((response) => {
          localStorage.setItem("userId", response.data[0].id)
          localStorage.setItem("companyId", response.data[0].companyId || "")
          setProvince(response.data[0].province || "")
        })
        .catch((error) => {
          console.error("Error fetching user data:", error)
        })
    } else {
      localStorage.removeItem("userId")
    }
  }, [isSignedIn, user])

  return (
    <header className="flex justify-between items-center px-6 py-4">
      <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
      <div className="flex gap-3 items-center">
        {!isSignedIn ? (
          <>
            <span className="px-4">
              <ProvinceDropdown province={province} setProvince={setProvince} />
            </span>
            <LogIn />
            <SignUp />
          </>
        ) : (
          <div className="flex items-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
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
      Gail can make mistakes. Your privacy is protected.
    </p>
  )
}

export {
  PrivateChatSideBar,
  PublicChatSideBar,
  MessageThread,
  InputMessage,
  Header,
  Disclaimer
}
