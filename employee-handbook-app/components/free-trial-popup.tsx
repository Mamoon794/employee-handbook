import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

interface FreeTrialModalProps {
  trialEndsAt: string;
  onClose: () => void;
  setSeenFreeTrialPopup: Dispatch<SetStateAction<boolean>>
}

export default function FreeTrialModal({ trialEndsAt, onClose, setSeenFreeTrialPopup }: FreeTrialModalProps) {
  const handleGotIt = () => {
    setSeenFreeTrialPopup(true);
    localStorage.setItem("seenFreeTrialPopup", "true");
    onClose();
  };

  const endDate = new Date(trialEndsAt);
  const formattedDate = endDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-lg px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-sm sm:max-w-md w-full text-center relative max-h-[90vh]">
        <h2 className="text-xl sm:text-2xl font-extrabold text-blue-800 mb-4 sm:mb-6 text-center">
          Welcome to Your Free Trial!
        </h2>

        <p className="text-gray-700 mb-6 text-sm sm:text-base">
          Enjoy a 7-day free trial of all premium features. Your trial will end on{" "}
          <strong>{formattedDate}</strong>.
        </p>
        <button
          onClick={handleGotIt}
          className="w-full bg-[#294494] text-white font-extrabold py-2 sm:py-3 rounded-xl text-sm sm:text-base hover:bg-blue-900 transition-colors shadow-md disabled:opacity-50"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
