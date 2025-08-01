"use client"

import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useEffect, useState, useCallback } from "react"
import axiosInstance from "../axios_config"
import PaywallModal from "../../../components/paywall-popup"
import { Header } from "../global_components"
import { CircularProgress } from "@mui/material"
import { TrashIcon } from "lucide-react"

type pdfFile = {
  name: string;
  type: string;
  url: string;
}

type CustProps = {
  files: pdfFile[];
  setFiles: React.Dispatch<React.SetStateAction<pdfFile[]>>;
};

const FilePreview: React.FC<CustProps> = ({ files, setFiles }) => {
  const handleOpen = (file: pdfFile) => {
    window.open(file.url, "_blank", "noopener,noreferrer");
  };


  async function handleDelete(file: pdfFile, index: number) {
    try{
      await axiosInstance.delete('/api/company/docs', {
          data: {
            companyId: localStorage.getItem('companyId'),
            index: index,
          },
      });
      setFiles(files.filter((_, i) => i !== index));

    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file. Please try again later.");
    }
  };

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
  );
};


export default function Dashboard() {
  const router = useRouter()
  const { user } = useUser()
  const firstName = user?.firstName || "there"
  const [showPaywall, setShowPaywall] = useState(false)
  const [savedFiles, setSavedFiles] = useState<pdfFile[]>([]);
  const [isLoading, setIsLoading] = useState(true)
  const [province, setProvince] = useState<string>("")


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

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      const userType = user.unsafeMetadata?.userType as string;
      
      if (userType === 'Employee') {
        setShowPaywall(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get('/api/check-subscription');
        const { subscribed } = response.data;
        
        setShowPaywall(!subscribed);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking subscription status:', error);
        // If error occurs, show paywall as fallback for employers only
        setShowPaywall(userType !== 'Employee');
        setIsLoading(false);
      }
    };

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
          <FilePreview files={savedFiles} setFiles={setSavedFiles} />
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
          <button
            className="w-full bg-[#e3e8f0] text-black font-extrabold py-4 rounded-xl mb-5 text-base hover:bg-[#d1d5db] transition-colors shadow-sm"
            onClick={() => router.push("/add-employee")}
          >
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

      {/* Paywall Modal */}
      {showPaywall && <PaywallModal />}
    </div>
  )
}
