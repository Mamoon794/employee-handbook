/* eslint-disable */

"use client"

import { useEffect, useState, Dispatch, SetStateAction, useRef, useMemo } from "react"
import NextLink from "next/link"
import { Plus, Menu, Trash2 } from "lucide-react"
import axiosInstance from "./axios_config"
import { useRouter } from "next/navigation"
import { useUser, UserButton } from "@clerk/nextjs"
import { Link, Message } from "../models/schema"
import { marked } from "marked"
import { Fragment } from "react"
import {
  Listbox,
  Label,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react"
import { CarouselCards } from "@/components/carousel-cards"
import type { CarouselCard, Citation } from "@/types/ai"
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

function mapCitationsToLinks(citations: Citation[]): Link[] {
  return citations.map((citation) => ({
    title: citation.title,
    url: citation.fragmentUrl || citation.originalUrl, // Use fragmentUrl if available, fallback to originalUrl
  }))
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

export function parseCarouselCards(markdown: string): {
  cards: CarouselCard[]
  remainingContent: string
} {
  const carouselRegex = /:::carousel\n([\s\S]*?):::/g
  const cards: CarouselCard[] = []
  let remainingContent = markdown

  let match
  while ((match = carouselRegex.exec(markdown)) !== null) {
    const carouselContent = match[1]
    const cardBlocks = carouselContent
      .split(/\n---\n/)
      .filter((block) => block.trim())

    for (const block of cardBlocks) {
      const lines = block.trim().split("\n")
      const card: CarouselCard = { title: "", content: "" }

      for (const line of lines) {
        if (line.startsWith("card:")) {
          card.title = line.replace("card:", "").trim()
        } else if (line.startsWith("content:")) {
          card.content = line.replace("content:", "").trim()
        } else if (line.startsWith("icon:")) {
          card.icon = line.replace("icon:", "").trim()
        } else if (line.startsWith("action:")) {
          const actionParts = line
            .replace("action:", "")
            .trim()
            .split("|")
            .map((p) => p.trim())
          if (actionParts.length === 2) {
            card.action = {
              text: actionParts[0],
              url: actionParts[1],
            }
          }
        } else if (card.content && line.trim()) {
          card.content += "\n" + line
        }
      }

      if (card.title && card.content) {
        cards.push(card)
      }
    }

    remainingContent = remainingContent.replace(match[0], "")
  }

  return { cards, remainingContent }
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
  const [isCollapsed, setIsCollapsed] = useState(false)

  const [showPopup, setShowPopup] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

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

  useEffect(() => {
    const stored = localStorage.getItem("hideChatWarning")
    if (stored === "true") {
      setDontShowAgain(true)
    }
  }, [])

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
        isCollapsed ? "w-16" : "w-[120px] md:w-64"
      } h-screen bg-[#1F2251] text-white flex flex-col min-h-screen relative transition-all duration-300 overflow-y-auto`}
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
          <div className="flex flex-col mb-20 space-y-2 overflow-hidden">
            {chats.slice(0, 8).map((chat, index) => (
              <button
                key={`${chat.id}-${index}`}
                className={`bg-[#343769] text-white text-left px-4 py-2 mx-4 rounded-lg hover:bg-[#45488f] overflow-hidden min-w-0 ${
                  currChatId === chat.id ? "border border-blue-300" : ""
                }`}
                onClick={() => selectChat(chat)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate flex-1 min-w-0 text-xs sm:text-sm">
                    {titleLoading && currChatId === chat.id
                      ? "Generating Title..."
                      : chat.title}
                  </span>
                  {currChatId === chat.id && (
                    <Trash2
                      className="text-gray-400 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(chat.id)
                      }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>

          <button className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full p-2 hover:bg-gray-400">
            <Plus className="text-[#1F2251]" onClick={showChatWarningPopup} />
          </button>
          {/* Popup */}
          {showPopup && (
            <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.2)] z-50 text-black">
              <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
                <h2 className="text-lg font-semibold mb-2">Start New Chat</h2>
                <p className="mb-4">
                  Only the 8 most recent chats will be shown. Older chats will
                  be hidden.
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
      needsTitleUpdate: true, 
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
        isCollapsed ? "w-16" : "w-[120px] md:w-64"
      } h-screen bg-[#1F2251] text-white flex flex-col min-h-screen relative transition-all duration-300 overflow-y-auto`}
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
          <div className="flex flex-col mb-20 space-y-2 overflow-hidden">
            {chats.map((chat, index) => (
              <button
                key={`${chat.id}-${index}`}
                className={`bg-[#343769] text-white text-left px-4 py-2 mx-4 rounded-lg hover:bg-[#45488f] overflow-hidden min-w-0 ${
                  selectedChat?.id === chat.id ? "border border-blue-300" : ""
                }`}
                onClick={() => {
                  handleChatChange(chat)
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate flex-1 min-w-0 text-xs sm:text-sm">
                    {titleLoading && selectedChat?.id === chat.id
                      ? "Generating Title..."
                      : chat.title}
                  </span>
                  {selectedChat?.id === chat.id && (
                    <Trash2
                      className="text-gray-400 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4"
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
    <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 pb-2 sm:pb-4">
      {JSON.stringify(questions) !== JSON.stringify(empty) && // only display questions after its updated with popular questions
        questions.map((q, i) => (
          <button
            key={i}
            onClick={() => setInputValue(q)}
            className="bg-blue-800 text-white font-semibold px-3 sm:px-6 py-1.5 sm:py-2 rounded-md hover:bg-blue-600 transition-colors text-xs sm:text-sm"
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

  const renderResponse = (content: string, offset: number, sources?: Link[]) => {
    const { cards, remainingContent } = parseCarouselCards(
      content
    );
    let html = markdownListToTable(remainingContent);
    if (sources?.length) {
      const supTags = sources
        .map((_, i) => `<sup>[${i + 1 + offset}]</sup>`)
        .join(" ");
      html = html.replace(/<\/p>\s*$/, `${supTags}</p>`);
    }
    return (
      <>
        {remainingContent.trim() && (
          <div
            className="text-sm sm:text-base"
            dangerouslySetInnerHTML={{
              __html: markdownListToTable(html),
            }}
          />
        )}
        {cards.length > 0 && <CarouselCards cards={cards} />}
      </>
    );
  }

  const renderSources = (offset: number, sources?: Link[]) => {
    if (!sources?.length) {
      return null
    }

    return (
      <div className="mt-2 flex flex-col gap-2">
        {sources
          .map((l, i) => (
            <a
              key={`legacy-${i}`}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-800 underline font-medium hover:text-blue-600 transition w-fit"
            >
              <sup>[{i + 1 + offset}]</sup> {l.title?.trim() || "View PDF Source"}
            </a>
          ))}
      </div>
    )
  }

  return (
    <div
      className="flex flex-1 flex-col gap-6 py-6 px-1 overflow-y-auto relative z-0"
      style={{ maxHeight: "calc(100vh - 130px)" }}
    >
      {messageList.length === 0 ? (
        <div className="flex flex-col justify-center items-center text-center flex-1 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-800 mb-2">
            Welcome to Gail!
          </h2>
          <h3 className="text-lg sm:text-xl font-medium text-blue-800">
            Your workplace rights & regulations chatbot
          </h3>
        </div>
      ) : (
        messageList.map((message, index) => { 
          const publicCount = message.publicSources?.length ?? 0;
          return (
          <div key={index} className="flex flex-col">
            {message.isFromUser ? (
              <div className="self-end bg-blue-100 text-gray-800 p-3 sm:p-4 rounded-md max-w-[85%] sm:max-w-[70%] shadow-sm text-sm sm:text-base">
                {message.content ? (
                  message.content.split("\n")
                  .map((line, idx) =>
                    line === "" ? <br key={idx} /> : <p className="wrap-anywhere" key={idx}>{line}</p>
                  )
                ) : null}
              </div>
            ) : (
              <div className="self-start bg-gray-100 text-gray-800 p-3 sm:p-4 rounded-md max-w-[85%] sm:max-w-[70%] shadow-sm text-sm sm:text-base">
                {message.content ? (
                  // ── Legacy path: continue to parse `message.content` + `message.sources` ──
                  <>
                    {renderResponse(message.content, 0, message.sources)}
                    {renderSources(0, message.sources)}
                  </>
                ) : (
                  // ── New path: render publicResponse + publicSources, then privateResponse + privateSources ──
                  <>
                    {/* PUBLIC RESPONSE */}
                    {message.publicResponse && (
                      <>
                        {renderResponse(message.publicResponse, 0, message.publicSources)}
                        {renderSources(0, message.publicSources)}
                      </>
                    )}

                    {/* separate public and private responses */}
                    {message.publicResponse && message.privateResponse && (
                      <hr className="my-4 border-gray-300" />
                    )}

                    {/* PRIVATE RESPONSE */}
                    {message.privateResponse && (
                      <>
                        {renderResponse(message.privateResponse, publicCount, message.privateSources)}
                        {renderSources(publicCount, message.privateSources)}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )})
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
  showHeader = true,
}: {
  province: string
  setProvince: (prov: string) => void
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
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : ""
    if (pathname === "/dashboard") {
      if (!isSignedIn) {
        router.push("/")
      } else if (!canSeeDashboard) {
        router.push("/chat")
      }
    } else if (pathname === "/finances") {
      if (!isSignedIn) {
        router.push("/")
      }
    } else if (pathname === "/analytics") {
      if (!isSignedIn) {
        router.push("/")
      } else if (!canSeeDashboard) {
        router.push("/chat")
      }
    }
  }

  useEffect(() => {
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : ""
    if (isSignedIn && user) {
      setIsOnDashboard(pathname === "/dashboard")
      axiosInstance
        .get(`/api/users/${user.id}?isClerkID=true`)
        .then((response) => {
          console.log("response.data in header: ", response.data)
          let userId = response.data[0].id
          localStorage.setItem("userId", userId)
          localStorage.setItem("companyId", response.data[0].companyId || "")
          localStorage.setItem(
            "companyName",
            response.data[0].companyName || ""
          )
          setCompanyName(response.data[0].companyName || null)
          setProvince(response.data[0].province || "")
          setIsFinance(response.data[0].userType == "Financer")
          setCanSeeDashboard(
            response.data[0].userType == "Owner" ||
              response.data[0].userType == "Administrator"
          )

          checkAuthentication(
            true,
            response.data[0].userType == "Owner" ||
              response.data[0].userType == "Administrator"
          )
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
    <header className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 bg-white min-h-[60px] header-stable relative z-10">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        {!isSignedIn || !canSeeDashboard ? (
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold italic text-blue-800 cursor-pointer flex-shrink-0 hidden sm:block">
            Gail
          </h1>
        ) : (
          <NextLink href="/dashboard">
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold italic text-blue-800 cursor-pointer flex-shrink-0 hidden sm:block">
              Gail
            </h1>
          </NextLink>
        )}
        {companyName && (
          <span className="text-sm sm:text-lg font-medium text-black hidden sm:block truncate">
            | {companyName}
          </span>
        )}
      </div>
      <div className="flex gap-2 sm:gap-4 items-center flex-shrink-0 min-w-0 overflow-visible">
        {canSeeDashboard && !isOnDashboard && isSignedIn && (
          <button
            className="px-3 sm:px-5 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm"
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </button>
        )}
        {isSignedIn && isOnDashboard && (
          <button
            className="px-3 sm:px-5 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm"
            onClick={() => router.push("/chat")}
          >
            Ask a Question
          </button>
        )}
        {(isFinance || canSeeDashboard) && isSignedIn && (
          <>
            <button
              className="px-3 sm:px-5 py-2 bg-blue-800 text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm hidden xl:block"
              onClick={() => router.push("/finances")}
            >
              View Finances
            </button>
            <button
              onClick={() => router.push("/analytics")}
              className="px-3 sm:px-5 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm hidden xl:block"
            >
              Analytics
            </button>
          </>
        )}

        <div className="flex gap-2 sm:gap-3 items-center flex-shrink-0">
          {!isSignedIn ? (
            <>
              <span className="px-2 sm:px-4 flex-shrink-0">
                <ProvinceDropdown
                  province={province}
                  setProvince={setProvince}
                />
              </span>
              <LogIn />
              <SignUp />
            </>
          ) : (
            <div className="flex items-center flex-shrink-0">
              <span className="px-2 sm:px-4 flex-shrink-0">
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
      className="bg-blue-800 text-white font-semibold px-3 sm:px-6 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
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
      className="border border-gray-300 text-gray-700 font-semibold px-3 sm:px-6 py-2 rounded-md hover:bg-gray-200 transition-colors text-xs sm:text-sm"
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
  const provincesList = [
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

  const provincesMap = {
    AB: "Alberta",
    BC: "British Columbia",
    MB: "Manitoba",
    NB: "New Brunswick",
    NL: "Newfoundland and Labrador",
    NT: "Northwest Territories",
    NS: "Nova Scotia",
    NU: "Nunavut",
    ON: "Ontario",
    PE: "Prince Edward Island",
    QC: "Quebec",
    SK: "Saskatchewan",
    YT: "Yukon",
  };  

  const fullToAbbr = useMemo(
    () =>
      Object.entries(provincesMap).reduce<Record<string, string>>(
        (acc, [code, full]) => {
          acc[full] = code
          return acc
        },
        {}
      ),
    []
  )

  const fullName = 
    province.length === 2
      ? provincesMap[province as keyof typeof provincesMap]
      : province
  
  const abbr =
    province.length === 2
      ? province
      : fullToAbbr[province]

  return (
    <Listbox
      value={fullName}
      onChange={setProvince}
    >
      <div className="relative inline-block z-[99999] dropdown-above-all">
        <Label className="sr-only">Change province or territory</Label>

        <ListboxButton className="w-[100px] md:w-[200px] px-3 sm:px-4 py-2 flex items-center rounded-md bg-white font-semibold border border-gray-300 text-gray-700 hover:bg-gray-200 transition-colors text-sm">
          <span className="md:hidden">{abbr}</span>
          <span className="hidden md:inline">Change your province/territory</span>
          <ChevronDown className="ml-auto h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
        </ListboxButton>

        <ListboxOptions className="absolute z-[9999] mt-1 max-h-60 w-[80px] md:w-[180px] overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/10">
        <ListboxOption
          value=""
          disabled
          as="li"
          className="md:hidden flex items-center px-3 sm:px-4 py-2 text-sm text-gray-500 cursor-not-allowed"
        >
          Change your province/territory
        </ListboxOption>

          {provincesList.map((p) => (
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
                    `flex cursor-pointer select-none items-center gap-2 px-3 sm:px-4 py-2 text-sm ` +
                    (active ? "bg-blue-100 text-blue-900" : "text-gray-900")
                  }
                >
                  <span className="flex-1">{p}</span>
                  {selected && <Check className="h-3 w-3 sm:h-4 sm:w-4" />}
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
    <p className="text-center text-xs sm:text-sm text-gray-500 mt-2 sm:mt-4">
      © Copyright 2025, Analana Inc. All rights reserved. GAIL can make
      mistakes, please verify your results.
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
  mapCitationsToLinks,
  ERROR_MESSAGE,
}
