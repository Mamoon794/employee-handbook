/* eslint-disable */

"use client"

import { useRouter } from "next/navigation"
import { useUser, UserButton } from "@clerk/nextjs"
import axiosInstance from "../axios_config"
import { useEffect, useState, useCallback } from "react"
import { CircularProgress } from "@mui/material"

type pdfFile = {
  name: string;
  type: string;
  url: string;
}

type CustProps = {
  files: pdfFile[];
};

const FilePreview: React.FC<CustProps> = ({ files }) => {
  const handleOpen = (file: pdfFile) => {
    window.open(file.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-h-64 overflow-y-auto w-full space-y-2 mb-3">
    {files.map((file, index) => (
      <div key={index}
        onClick={() => handleOpen(file)}
        className="cursor-pointer p-4 border rounded hover:bg-gray-100"
      >
        <p className="text-blue-600">{file.name}</p>
      </div>
    ))}
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter()
  const { user } = useUser()
  const [savedFiles, setSavedFiles] = useState<pdfFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const firstName = user?.firstName || "there"


  const fetchCompanyDocs = useCallback(async () => {
    const companyId = localStorage.getItem('companyId');
    if (!companyId) return;
    const companyDocs = await axiosInstance.get(`/api/company/docs/${companyId}`);
    let get_files : pdfFile[]  = []
    for (const doc of companyDocs.data.companyDocs) {
      get_files.push({
        name: doc.fileName,
        type: 'application/pdf',
        url: doc.fileUrl,
      });
    }
    setSavedFiles(get_files);
  }, []);

  useEffect(() => {
    if (localStorage.getItem('companyId')) {
      fetchCompanyDocs();
    }
  }, [fetchCompanyDocs]);

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
      let documentData = [];
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
          url: url
        });
        documentData.push({
          fileUrl: url,
          fileName: files[i].name,
          uploadDate: new Date(),
          isPublic: false,
        });
        
        await axiosInstance.post("/api/vectordb-documents", {
          fileurl: url,
          namespace: companyName,
        })
      }
      setSavedFiles([...savedFiles]);
      await axiosInstance.put('/api/company/docs',{
        companyId: localStorage.getItem('companyId'),
        documents: documentData,
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      alert("Failed to upload documents. Please try again later.");
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 bg-white shadow-sm">
        <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
        <div className="flex gap-4 items-center">
          <button
            className="px-5 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm"
            onClick={() => {
              router.push("/chat")
            }}
          >
            Ask a Question
          </button>
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
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-15 h-15",
              },
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-24 px-8 py-16 w-full max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-extrabold text-blue-800 mb-8 text-center">
            Welcome, {firstName}!
          </h2>
          {savedFiles.length > 0 ? (
            <p className="text-lg text-black font-bold mb-12 text-center">You have {savedFiles.length} files uploaded:</p>
          ) : (
            <p className="text-lg text-black font-bold mb-12 text-center">It seems there are currently no files uploaded.</p>
          )}
          <FilePreview files={savedFiles} />
          {isLoading ? (
            <CircularProgress />
            
          )
          : (<label className="bg-[#294494] text-white font-extrabold px-12 py-5 rounded-xl text-xl hover:bg-blue-900 transition-colors shadow-md cursor-pointer">
            Upload Documents
            <input
              type="file"
              name="file"
              accept=".pdf"
              multiple
              onChange={uploadDocuments}
              className="hidden"
            />
          </label>)}
        </div>
        {/* Employee Management Card */}
        <div className="w-full max-w-sm bg-[#f5f7fb] rounded-xl shadow-lg flex flex-col items-center py-12 px-8">
          <div className="text-xl font-bold text-black mb-10 text-center">
            Employee Management
          </div>
          <button className="w-full bg-[#e3e8f0] text-black font-extrabold py-4 rounded-xl mb-5 text-base hover:bg-[#d1d5db] transition-colors shadow-sm">
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
    </div>
  )
}
