/* eslint-disable */

import { useEffect, useState, Dispatch, SetStateAction, useRef } from "react"
import { Search, Mic, Loader2 } from "lucide-react"
import axiosInstance from "./axios_config"
import { Message } from "../models/schema"
import { useAudioRecorder } from "react-use-audio-recorder"
import { generateThreadId, mapCitationsToLinks } from "./global_components"
import { Filter } from 'bad-words'

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
  setError: Dispatch<SetStateAction<{message: string, chatId: string}>>;
  setCurrChatId: Dispatch<SetStateAction<string>>
  setTitleLoading: Dispatch<SetStateAction<boolean>>
  setChats: Dispatch<SetStateAction<Chat[]>>
  chats: Chat[]
}) {
  const errorMessage = "Oops, something went wrong. Want to try again?"

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
            console.error("Error during transcription:", error);
            setError({"message": errorMessage, "chatId": chatId || ''});
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

  /**
   * Fetches an AI‐generated title and updates chats accordingly.
   * Always triggers AI title generation after the first message in a chat,
   * i.e. when the chat is brand-new (only one message) or has been flagged
   * for a title update (needsTitleUpdate = true).
   */
  const generateChatTitle = async (
    message: string,
    chatId: string,
    userId: string
  ) => {
    setTitleLoading(true);
    try {
      const res = await fetch("/api/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, chatId, userId }),
      });

      if (!res.ok) throw new Error("Title generation failed");

      const { title } = await res.json();
      if (title && title !== "New Chat") {
        setChats(prevChats =>
          prevChats.map(c =>
            c.id === chatId
              ? { ...c, title, needsTitleUpdate: false }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Title generation failed", err);
    } finally {
      setTitleLoading(false);
    }
  };

  const submitUserMessage = async () => {
    let messageContent = inputValue.trim();
    if (!messageContent) return;

    const filter = new Filter()
    messageContent = filter.clean(messageContent)

    const userMessage: Omit<Message, "createdAt"> = {
      isFromUser: true,
      content: messageContent,
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
      setError({"message": "", "chatId": ""});

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
        await handlePublicChat(newChatId, messageContent);
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
        } else {
          await axiosInstance.put(`/api/chat/${chatId}/add-message`, {
            messageData: userMessage
          });
        }
        await handlePrivateChat(newChatId, messageContent)
      }

      const shouldGenerateTitle = isNewChat || (chatObj && chatObj.needsTitleUpdate);
      if (shouldGenerateTitle) {
        const userId = isPrivate
          ? localStorage.getItem("userId") || ""
          : "public";
        await generateChatTitle(messageContent, newChatId, userId);
      }

    } catch (err) {
      console.error(err);
      setError({"message": errorMessage, "chatId": chatId || ''});
    }
  }

  const handlePrivateChat = async (newChatId: string, message: string) => {
    const full_province = province;
    console.log("private province", province)
    const companyName = localStorage.getItem("companyName") || ""
    const res = await axiosInstance.post(`/api/messages/private`, {
      province: full_province,
      query: message,
      threadId: newChatId,
      company: companyName,
    })
    if (res.status !== 200) {
      setError({"message": errorMessage, "chatId": newChatId});
      return;
    }

    const data = res.data
    if (data.privateResponse) {
      const botMessage = {
        isFromUser: false,
        publicResponse: data.publicResponse,
        privateResponse: data.privateResponse,
        publicSources: data.publicSources ? mapCitationsToLinks(data.publicSources) : [],
        privateSources: data.privateSources ? mapCitationsToLinks(data.privateSources) : []
      }
      setMessages((prevMessages) => [...prevMessages, botMessage as Message])
      axiosInstance.put(`/api/chat/${newChatId}/add-message`, {
        messageData: botMessage,
      });
    }
    else {
      setError({"message": errorMessage, "chatId": newChatId});
    }
  };
  
  const handlePublicChat = async (newChatId: string, message: string) => {
    if (!province) return;

    try {
      console.log("public province", province)
      
      const res = await fetch("/api/messages/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          province,
          query: message,
          threadId: newChatId
        }),
      })

      if (!res.ok) {
        throw new Error("Network response was not ok")
      }

      const data = await res.json()
      if (data.publicResponse) {
        const botMessage = {
          isFromUser: false,
          createdAt: new Date(),
          publicResponse: data.publicResponse,
          publicSources: data.publicSources ? mapCitationsToLinks(data.publicSources) : []
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
        setError({"message": errorMessage, "chatId": newChatId || ''});
      }
    } catch (err) {
      console.error("Error in public chat:", chatId)
      setError({"message": errorMessage, "chatId": newChatId || ''});
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
        className={`bg-white resize-none w-full pl-12 pr-12 py-2 sm:py-4 border border-gray-300 rounded-md 
          text-sm sm:text-lg text-black placeholder-gray-400 overflow-y-auto ${ atMaxHeight ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
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
          <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
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
        <Search className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  )
}
