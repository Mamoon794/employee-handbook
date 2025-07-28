/* eslint-disable */

import { useEffect, useState, Dispatch, SetStateAction, useRef } from "react"
import { Search, Mic, Loader2 } from "lucide-react"
import axiosInstance from "./axios_config"
import { Link, Message } from "../models/schema"
import { Citation } from "@/types/ai"
import { useAudioRecorder } from "react-use-audio-recorder"
import { generateThreadId } from './global_components';

interface Chat {
  id: string
  title: string
  needsTitleUpdate?: boolean
  messages?: Message[]
}

export function MessageInput({
  inputValue,
  setInputValue,
  isPrivate,
  province,
  chatId,
  setMessages,
  setError,
  setCurrChatId,
  setTitleLoading,
  setChats,
  chats,
}: {
  inputValue: string
  setInputValue: Dispatch<SetStateAction<string>>
  isPrivate: boolean
  province?: string | null
  chatId: string
  setMessages: Dispatch<SetStateAction<Message[]>>
  setError: Dispatch<SetStateAction<string>>
  setCurrChatId: Dispatch<SetStateAction<string>>
  setTitleLoading?: Dispatch<SetStateAction<boolean>>
  setChats: Dispatch<SetStateAction<Chat[]>>
  chats: Chat[]
}) {
  const errorMessage = "Oops, something went wrong. Want to try again?"
  const province_map: { [key: string]: string } = {
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

  const {
    recordingStatus, // "inactive" | "recording" | "paused" | "stopped"
    recordingTime, // in seconds
    startRecording,
    stopRecording,
  } = useAudioRecorder()

  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const toggleMic = () => {
    if (listening) {
      setListening(false)
      stopRecording(async (blob) => {
        if (blob) {
          setTranscribing(true)
          const audioFile = new File(
            [blob],
            `recording-${new Date().toISOString()}.wav`,
            { type: blob.type }
          )
          const formData = new FormData()
          formData.append("file", audioFile)
          try {
            const response = await axiosInstance.post(
              "/api/messages/transcribe",
              formData
            )
            console.log("Transcription response:", response)
            setInputValue(inputValue + " " + response.data.transcription)
          } catch (error) {
            console.error("Error during transcription:", error)
            setError(errorMessage)
          } finally {
            setTranscribing(false)
          }
        }
      })
      console.log("Recording stopped, blob:")
    } else {
      setListening(true)
      startRecording()
    }
  }

  const submitUserMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Omit<Message, "createdAt"> = {
      isFromUser: true,
      content: inputValue,
    }

    try {
      // tracking if brand new chat
      let isNewChat = chatId === '';
      // Find the chat object for this chatId
      let chatObj: Chat | undefined = undefined;
      chatObj = chats.find((c: Chat) => c.id === chatId);
      if (chatObj === undefined) {
        isNewChat = true;
        chatId = '';
        setCurrChatId('')
      }    

      setInputValue('');
      setError('');

      let newChatId = chatId || '';
      if (!isPrivate) {  // public user
        if (isNewChat) {
          newChatId = generateThreadId()
          setCurrChatId(newChatId)
          const updated = [userMessage as Message]
          setMessages(updated);
          setChats(prevChats => [
            {
              id: newChatId,
              title: 'New Chat',
              messages: updated,
              needsTitleUpdate: true
            },
            ...prevChats
        ])
        } else {
          setMessages((prevMessages) => {
            const updated = [...prevMessages, userMessage as Message]
            setChats(prevChats => {
              return prevChats.map(c =>
                c.id === chatId ? { ...c, messages: updated } : c
              )
            });
            return updated;
          });
        }
        await handlePublicChat(newChatId);

        // AI-generated title for public chat
        if (setChats && (isNewChat || (chatObj && chatObj.needsTitleUpdate))) {
          if (setTitleLoading) setTitleLoading(true);
          try {
            const titleRes = await fetch('/api/generate-title', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: inputValue,
                chatId: newChatId,
                userId: 'public'
              }),
            });

            if (!titleRes.ok) throw new Error('Title generation failed');

            const { title } = await titleRes.json();
            if (title && title !== "New Chat" && setChats) {
              setChats(prevChats => {
                return prevChats.map(chat =>
                  chat.id === (newChatId)
                    ? { ...chat, title, needsTitleUpdate: false }
                    : chat
                );
              });
            }
          } catch (err) {
            console.error('title generation failed', err);
          } finally {
            if (setTitleLoading) setTitleLoading(false);
          }
        }
      } else { // private user
        setMessages((prevMessages) => {
          return [...prevMessages, userMessage as Message]
        })
          
        if (isNewChat) {
          const newChat = await axiosInstance.post("/api/chat", {
            userId: localStorage.getItem("userId"),
            title: "New Chat",
            messages: [userMessage],
            needsTitleUpdate: true, // propagate flag
          })
          newChatId = newChat.data.id
          if (setCurrChatId) setCurrChatId(newChatId)
          await handlePrivateChat(newChatId)
        } else {
          await axiosInstance.put(`/api/chat/${chatId}/add-message`, {
            messageData: userMessage
          });
          await handlePrivateChat(newChatId);
        }

        // Always trigger AI title generation after the first message in a chat
        // Only do this if the chat has exactly one message (i.e., just created)
        // or if needsTitleUpdate is true
        if (setChats && (isNewChat || (chatObj && chatObj.needsTitleUpdate))) {
          if (setTitleLoading) setTitleLoading(true)
          try {
            const titleRes = await fetch("/api/generate-title", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: inputValue,
                chatId: newChatId,
                userId: localStorage.getItem("userId"),
              }),
            })

            if (!titleRes.ok) throw new Error("Title generation failed")

            const { title } = await titleRes.json()
            if (title && title !== "New Chat" && setChats) {
              setChats((prevChats) => {
                return prevChats.map((chat) =>
                  chat.id === newChatId
                    ? { ...chat, title, needsTitleUpdate: false }
                    : chat
                )
              })
            }
          } catch (err) {
            console.error("title generation failed", err)
          } finally {
            if (setTitleLoading) setTitleLoading(false)
          }
        }
      }
    } catch (err) {
      console.error(err)
      setError(errorMessage)
    }
  }

  function mapCitationsToLinks(citations: Citation[]): Link[] {
    return citations.map((citation) => ({
      title: citation.title,
      url: citation.fragmentUrl || citation.originalUrl, // Use fragmentUrl if available, fallback to originalUrl
    }))
  }

  const handlePrivateChat = async (new_chatId: string) => {
    const full_province = province ? province_map[province] : ""
    console.log("private province", province)
    const companyName = localStorage.getItem("companyName") || ""
    const res = await axiosInstance.post(`/api/messages/private`, {
      province: full_province,
      query: inputValue,
      threadId: new_chatId,
      company: companyName,
    })
    if (res.status !== 200) {
      setError(errorMessage)
      return
    }

    const data = res.data
    if (data.response) {
      const botMessage = {
        content: data.response,
        isFromUser: false,
        sources: mapCitationsToLinks(data.citations),
      }
      setMessages((prevMessages) => [...prevMessages, botMessage as Message])
      axiosInstance.put(`/api/chat/${new_chatId}/add-message`, {
        messageData: botMessage,
      })
    } else {
      setError(errorMessage)
    }
  };
  
  const handlePublicChat = async (newChatId: string) => {
    if (!province) return;

    try {
      console.log("public province", province)
      const res = await fetch("/api/messages/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          province,
          query: inputValue,
          threadId: newChatId,
          company: "",
        }),
      })

      if (!res.ok) {
        throw new Error("Network response was not ok")
      }

      const data = await res.json()
      if (data.response) {
        const botMessage = {
          content: data.response,
          isFromUser: false,
          createdAt: new Date(),
          sources: mapCitationsToLinks(data.citations),
        }
        setMessages((prevMessages) => {
          const updated = [...prevMessages, botMessage as Message]
          setChats(prevChats => {
            return prevChats.map(c =>
              c.id === newChatId ? { ...c, messages: updated } : c
            )
          });
          return updated;
        });
      } else {
        setError(errorMessage)
      }
    } catch (err) {
      console.error(err)
      setError(errorMessage)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submitUserMessage()
    }
  }

  // put focus back on the text input so Enter will submit
  useEffect(() => {
    if (!transcribing) {
      textareaRef.current?.focus();
    }
  }, [transcribing])

  const [atMaxHeight, setAtMaxHeight] = useState(false);

  const lineHeight = 28; // 28px is the line height for text-lg
  const maxLines = 8;
  const maxHeight = maxLines * lineHeight;

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    const textarea = textareaRef.current as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
      setAtMaxHeight(textarea.scrollHeight > maxHeight - 1);

      if (textarea.scrollHeight > maxHeight) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
      setAtMaxHeight(textarea.scrollHeight > maxHeight - 1);

      if (textarea.scrollHeight > maxHeight) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    }
  }, [inputValue]);

  return(
    <div className="relative w-full max-w-4xl mx-auto">
      <textarea
        ref={textareaRef}
        rows={1}
        value={inputValue}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={transcribing}
        placeholder="Ask anything"
        className={`bg-white resize-none w-full px-13 py-4 border border-gray-300 rounded-md 
          text-lg text-black placeholder-gray-400 overflow-y-auto ${ atMaxHeight ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
        style={{ minHeight: lineHeight, maxHeight: maxHeight }}
      />

      {transcribing ? (
        <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 animate-spin text-gray-500" />
      ) : (
        <button
          type="button"
          onClick={toggleMic}
          className={`absolute left-4 top-1/2 -translate-y-1/2
                      ${
                        listening
                          ? "text-red-600 animate-pulse"
                          : "text-gray-400 hover:text-gray-600 transition-colors"
                      }`}
          title={listening ? "Stop recording" : "Speak your question"}
        >
          <Mic className="w-6 h-6" />
        </button>
      )}

      <button
        type="button"
        disabled={transcribing || listening}
        onClick={submitUserMessage}
        className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400
                  ${
                    transcribing || listening
                      ? "cursor-not-allowed opacity-50"
                      : "hover:text-gray-600 transition-colors"
                  }`}
      >
        <Search className="w-6 h-6" />
      </button>
    </div>
  )
}
