import { useEffect, useState } from "react";

const provinces = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland and Labrador", "Nova Scotia", "Ontario",
  "Prince Edward Island", "Quebec", "Saskatchewan"
];

interface ProvincePopupProps {
  onSave: (province: string) => void;
}

export default function ProvincePopup({ onSave }: ProvincePopupProps) {
  const [open, setOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");

  useEffect(() => {
    const storedProvince = localStorage.getItem("province");
    if (!storedProvince) {
      setOpen(true);
    } else {
      onSave(storedProvince);
    }
  }, [onSave]);

  const handleConfirm = () => {
    if (!selectedProvince) return;
    localStorage.setItem("province", selectedProvince);
    onSave(selectedProvince);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25">
      <div className="bg-white rounded-lg shadow-md p-8 w-[95%] max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Select your province
        </h2>

        <div className="mb-6 relative">
          <select
            className="w-full border-none rounded-md bg-gray-200 text-gray-700 appearance-none py-3 px-4 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
          >
            <option value="">Choose province</option>
            {provinces.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
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
