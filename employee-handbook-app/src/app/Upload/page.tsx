/* eslint-disable */

'use client';

import { useState, useRef, useEffect } from 'react';

import axiosInstance from '../axios_config';

export default function UploadDocument() {
  type pdfFile = {
    name: string;
    type: string;
    url: string;
  }
  const [files, setFiles] = useState<File[]>([]);
  const [savedFiles, setSavedFiles] = useState<pdfFile[]>([]);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchCompanyDocs() {
      const companyId = localStorage.getItem('companyId');
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
    }
    if (localStorage.getItem('companyId')) {
      fetchCompanyDocs();
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleCancel = () => {
    setFiles([]);
    setIsUploaded(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  async function uploadFilesToBackend(files: File[]) {
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      formData.append('bucketName', 'employee-handbook-app');
      const s3Response = await axiosInstance.post('/api/s3/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      let url = s3Response.data.fileUrl;
      const documentData = {
        fileUrl: url,
        fileName: files[i].name,
        uploadDate: new Date(),
        isPublic: false,
      };
      await axiosInstance.put('/api/company/docs',{
        companyId: localStorage.getItem('companyId'),
        documents: [documentData],
      });
      
    }
  }

  const handleSave = async () => {
    if (files.length === 0) return;
    setUploading(true);
    await uploadFilesToBackend(files);
    setUploading(false);
    setIsUploaded(true);
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="flex justify-between items-center px-8 py-6 shadow-sm">
        <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
        <div className="flex gap-4 items-center">
          <button className="px-6 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors">Ask a Question</button>
          <button className="px-6 py-2 bg-blue-800 text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors">View Finances</button>
          <button className="px-6 py-2 border border-gray-300 text-sm rounded-xl">Log Out</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <h2 className="text-3xl font-semibold text-blue-800 mb-10 text-center">
          Welcome, rivvi!
        </h2>

        {/* Upload area or uploaded file preview */}
        {!isUploaded ? (
          <div className="w-full max-w-2xl bg-gray-100 rounded-xl border border-gray-300 p-6 mb-8 text-center">
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="upload"
              ref={fileInputRef}
            />
            <label
              htmlFor="upload"
              className="cursor-pointer block py-10 px-4 border-2 border-dashed border-gray-400 rounded-lg hover:bg-gray-200 transition"
            >
              {files.length > 0 ? (
                <div className="flex flex-col items-center gap-2 relative w-full">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between w-full max-w-xs bg-white border border-gray-200 rounded-xl shadow px-4 py-3 mb-2 hover:shadow-md transition-all"
                      style={{ minWidth: '220px' }}
                    >
                      <div className="flex items-center gap-3">
                        <FilePreview file={file} />
                        <div className="flex flex-col">
                          <span className="truncate max-w-[120px] text-gray-900 font-semibold text-base" title={file.name}>{file.name}</span>
                          <span className="text-xs text-gray-500 uppercase mt-1">{file.type === 'application/pdf' ? 'PDF' : (file.type.split('/')[1] || 'file')}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                        className="ml-3 text-gray-400 hover:text-red-600 transition-colors duration-150"
                        aria-label="Remove file"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Click or drag to upload HR Handbook (PDF or image)</p>
              )}
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-8 w-full">
            <div className="flex flex-col items-center gap-2 w-full">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between w-full max-w-xs bg-white border border-gray-200 rounded-xl shadow px-4 py-3 mb-2 hover:shadow-md transition-all"
                  style={{ minWidth: '220px' }}
                >
                  <div className="flex items-center gap-3">
                    <FilePreview file={file} />
                    <div className="flex flex-col">
                      <span className="truncate max-w-[120px] text-gray-900 font-semibold text-base" title={file.name}>{file.name}</span>
                      <span className="text-xs text-gray-500 uppercase mt-1">{file.type === 'application/pdf' ? 'PDF' : (file.type.split('/')[1] || 'file')}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="ml-3 text-gray-400 hover:text-red-600 transition-colors duration-150"
                    aria-label="Remove file"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              className="mt-6 bg-blue-800 text-white font-semibold px-8 py-3 rounded-md hover:bg-blue-700"
              onClick={handleCancel}
            >
              Upload Documents
            </button>
          </div>
        )}

        {/* Action buttons */}
        {!isUploaded && (
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="bg-blue-800 text-white font-semibold px-6 py-3 rounded-md hover:bg-blue-700"
              disabled={files.length === 0 || uploading}
            >
              {uploading ? 'Uploading...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="border border-gray-400 text-black font-semibold px-6 py-3 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        )}
      </main>

      <footer className="w-full h-24 bg-[#294494] mt-auto" />
    </div>
  );
}

function FilePreview({ file }: { file: File }) {
  if (file.type.startsWith('image/')) {
    return <img src={URL.createObjectURL(file)} alt="Preview" className="w-12 h-12 object-contain rounded shadow" />;
  }
  if (file.type === 'application/pdf') {
    return (
      <span className="w-12 h-12 flex items-center justify-center bg-blue-800/10 rounded text-blue-800">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 2.25A2.25 2.25 0 0 0 3.75 4.5v15A2.25 2.25 0 0 0 6 21.75h12a2.25 2.25 0 0 0 2.25-2.25v-9.379a2.25 2.25 0 0 0-.659-1.591l-4.621-4.621A2.25 2.25 0 0 0 14.129 3.75H6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
        </svg>
      </span>
    );
  }
  return (
    <span className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </span>
  );
}