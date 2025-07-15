/* eslint-disable */

import { useEffect, useState, Dispatch, SetStateAction, useRef} from 'react';
import { Search, Mic, Loader2 } from 'lucide-react';
import axiosInstance from './axios_config';
import { Link, Message } from '../models/schema'; 
import { Citation } from '@/types/ai';
import { useAudioRecorder } from "react-use-audio-recorder";


export function MessageInput({
  inputValue,
  setInputValue,
  isPrivate,
  province,
  chatId,
  setMessages,
  setError,
  setCurrChatId,
  threadId
}: {
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  isPrivate: boolean;
  province?: string | null;
  chatId?: string;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setError: Dispatch<SetStateAction<string>>;
  setCurrChatId?: Dispatch<SetStateAction<string>>;
  threadId?: string | null
}) {
  const errorMessage = 'Oops, something went wrong. Want to try again?'
  const province_map: { [key: string]: string } = {
    "ON": "Ontario",
    "AB": "Alberta",
    "BC": "British Columbia",
    "MB": "Manitoba",
    "NB": "New Brunswick",
    "NL": "Newfoundland and Labrador",
    "NS": "Nova Scotia",
    "PE": "Prince Edward Island",
    "QC": "Quebec",
    "SK": "Saskatchewan",
    "NT": "Northwest Territories",
    "NU": "Nunavut",
    "YT": "Yukon"
  }

  const {
    recordingStatus, // "inactive" | "recording" | "paused" | "stopped"
    recordingTime,   // in seconds
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleMic = () => {
    if (listening) {
      setListening(false);
      stopRecording(async (blob) => {
        if (blob) {
          setTranscribing(true);
          const audioFile = new File([blob], `recording-${new Date().toISOString()}.wav`, {type: blob.type});
          const formData = new FormData();
          formData.append('file', audioFile);
          try {
            const response = await axiosInstance.post("/api/messages/transcribe", formData);
            console.log("Transcription response:", response);
            setInputValue(inputValue + " " + response.data.transcription);
          } catch (error) {
            console.error("Error during transcription:", error);
            setError(errorMessage);
          } finally {
            setTranscribing(false);
          }
        }
      });
      console.log("Recording stopped, blob:");
    } else {
      setListening(true);
      startRecording();
    }
  };

  const submitUserMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      const userMessage: Omit<Message, 'createdAt'> = {
        isFromUser: true,
        content: inputValue,
      };
      setMessages((prevMessages) => [...prevMessages, userMessage as Message]);
      setInputValue('');
      setError('');

      if (isPrivate) {
        let newChatId = chatId || '';
        if (chatId === '') {
            const newChat = await axiosInstance.post('/api/chat', {
            userId: localStorage.getItem('userId'),
            title: `Chat - ${new Date().toLocaleDateString()}-1`,
            messages: [userMessage]
          });
          if(setCurrChatId) setCurrChatId(newChat.data.id);
          newChatId = newChat.data.id;

        }

        else{
          axiosInstance.put(`/api/chat/${chatId}/add-message`, {
            messageData: userMessage
          });
        }
        await handlePrivateChat(newChatId);
      } else {
        await handlePublicChat();
      }
    } catch (err) {
      console.error(err);
      setError(errorMessage);
    }
  };
  
  function mapCitationsToLinks(citations: Citation[]): Link[] {
    return citations.map(citation => ({
      title: citation.title,
      url: citation.fragmentUrl || citation.originalUrl // Use fragmentUrl if available, fallback to originalUrl
    }));
  }

  const handlePrivateChat = async (new_chatId: string) => {
    const full_province = province ? province_map[province] : '';
    console.log("province", province);
    const res = await axiosInstance.post(`/api/public/message`, {
      province,
      query: inputValue,
      threadId: new_chatId
    });
    if (res.status !== 200) {
      setError(errorMessage);
      return;
    }

    const data = res.data;
    if (data.response) {
      const botMessage = {
        content: data.response,
        isFromUser: false,
        sources: mapCitationsToLinks(data.citations),
      }
      setMessages((prevMessages) => [...prevMessages, botMessage as Message]);
      axiosInstance.put(`/api/chat/${new_chatId}/add-message`, {
        messageData: botMessage,
      });
    }
    else {
      setError(errorMessage);
    }
  };

  const handlePublicChat = async () => {
    if (!province) return;

    try {
      console.log("province", province);
      const res = await fetch('/api/public/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          province,
          query: inputValue,
          threadId
        }),
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await res.json();
      if (data.response) {
        const botMessage = {
          content: data.response,
          isFromUser: false,
          createdAt: new Date(),
          sources: mapCitationsToLinks(data.citations),
        }
        setMessages((prevMessages) => [...prevMessages, botMessage as Message]);
      } else {
        setError(errorMessage);
      }
    } catch (err) {
      console.error(err);
      setError(errorMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitUserMessage();
    }
  };

  // put focus back on the text input so Enter will submit
  useEffect(() => {
    if (!transcribing) {
      inputRef.current?.focus();
    }
  }, [transcribing]);

  return(
    <div className="relative w-full max-w-4xl mx-auto">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={transcribing}
        placeholder="Ask anything"
        className="w-full px-13 py-4 border border-gray-300 rounded-md 
                  text-lg text-black placeholder-gray-400"
      />

      {transcribing ? (
        <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 animate-spin text-gray-500" />
      ) :
        <button
          type="button"
          onClick={toggleMic}
          className={`absolute left-4 top-1/2 -translate-y-1/2
                      ${listening ? "text-red-600 animate-pulse" : "text-gray-400 hover:text-gray-600 transition-colors"}`}
          title={listening ? "Stop recording" : "Speak your question"}
        >
          <Mic className="w-6 h-6" />
        </button>
      }

      <button
        type="button"
        disabled={transcribing || listening}
        onClick={submitUserMessage}
        className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400
                  ${transcribing || listening ? "cursor-not-allowed opacity-50" : 
                  "hover:text-gray-600 transition-colors"}`}
      >
        <Search className="w-6 h-6" />
      </button>
    </div>
  )
}