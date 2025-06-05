"use client";

import Image from "next/image";
import { useState } from "react";
import ProvincePopup from "../../components/province";

export default function Home() {
 
 const [province, setProvince] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center">

      <ProvincePopup onSave={(prov) => setProvince(prov)} />
    </div>
  );
}
