import React from 'react';

interface LimitReachedModalProps {
  open: boolean;
  onNew: () => void;
  onLogin: () => void;
}

export default function LimitReachedModal({ open, onNew, onLogin }: LimitReachedModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
        <h2 className="text-lg font-bold mb-4">Chat limit reached</h2>
        <p className="mb-6">
          You've reached the maximum number of messages for this session. To continue,
          please log in or start a new chat.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onNew}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            New Chat
          </button>
          <button
            onClick={onLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
