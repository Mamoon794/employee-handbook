'use client';

import { useState } from 'react';

export default function UploadDocument() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleCancel = () => {
    setFile(null);
  };

  const handleSave = () => {
    // Logic to upload or save file
    alert('File saved!');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-bold text-blue-800">Gail</h1>
        <div className="flex items-center gap-4">
          <button className="bg-blue-900 text-white font-medium px-4 py-2 rounded-md">
            Ask a Question
          </button>
          <button className="border border-blue-800 text-blue-800 font-medium px-4 py-2 rounded-md">
            Log Out
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <h2 className="text-3xl font-semibold text-blue-800 mb-10 text-center">
          Welcome, rivvi!
        </h2>

        <div className="w-full max-w-2xl bg-gray-100 rounded-xl border border-gray-300 p-6 mb-8 text-center">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="upload"
          />
          <label
            htmlFor="upload"
            className="cursor-pointer block py-10 px-4 border-2 border-dashed border-gray-400 rounded-lg hover:bg-gray-200 transition"
          >
            {file ? (
              <div className="flex flex-col items-center">
                <img
                  src="/pdf-icon.png"
                  alt="PDF Icon"
                  className="w-12 h-12 mb-2"
                />
                <p className="text-gray-700 font-medium">{file.name}</p>
              </div>
            ) : (
              <p className="text-gray-600">Click to upload HR Handbook (PDF)</p>
            )}
          </label>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="bg-blue-800 text-white font-semibold px-6 py-3 rounded-md hover:bg-blue-700"
            disabled={!file}
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="border border-gray-400 text-black font-semibold px-6 py-3 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </main>

      <footer className="bg-blue-800 h-6 w-full mt-12" />
    </div>
  );
}