import { useEffect, useState } from "react";

const provinces = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland and Labrador", "Nova Scotia", "Ontario",
  "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", 
  "Nunavut", "Yukon"
];

interface ProvincePopupProps {
  onSave: (province: string) => void;
}

export default function ProvincePopup({ onSave }: ProvincePopupProps) {
  const [open, setOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");

  useEffect(() => {
    setOpen(true);
  }, []);

  const handleConfirm = () => {
    if (!selectedProvince) return;
    //saves the province to localStorage in the browser
    localStorage.setItem("province", selectedProvince);
    onSave(selectedProvince);
    setOpen(false); //closes the popup
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-md p-8 w-[95%] max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Select your province/territory
        </h2>

        <div className="mb-6 relative">
          <select
            className="w-full border-none rounded-md bg-gray-200 text-gray-700 appearance-none py-3 px-4 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
          >
            <option value="" disabled hidden>Choose province/territory</option>
            {provinces.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleConfirm}
          className="bg-blue-800 text-white font-semibold px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
          disabled={!selectedProvince}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
