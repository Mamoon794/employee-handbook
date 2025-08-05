import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

interface FreeTrialModalProps {
  trialEndsAt?: string;
  onClose: () => void;
}

export default function FreeTrialModal({ trialEndsAt, onClose }: FreeTrialModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const { signOut } = useClerk();

  const handleGotIt = () => {
    setAcknowledged(true);
    onClose();
  };

  const endDate = new Date(trialEndsAt);
  const formattedDate = endDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-lg px-6 py-6 max-w-sm w-full text-center relative overflow-y-auto">
        <h2 className="text-2xl font-extrabold text-blue-800 mb-4">
          Welcome to Your Free Trial!
        </h2>
        <p className="text-gray-700 mb-6">
          Enjoy a 7-day free trial of all premium features. Your trial will end on{" "}
          <strong>{formattedDate}</strong>.
        </p>
        <button
          onClick={handleGotIt}
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
