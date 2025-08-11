import axiosInstance from "@/app/axios_config";
import { NextRequest, NextResponse } from "next/server";
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

export async function POST(request: NextRequest) {
  try {
    const audioFormData = await request.formData();
    const response = await axiosInstance.post(`${AI_SERVICE_URL}/transcribe`, audioFormData)
    return NextResponse.json({"message": "Audio transcribed successfully", "transcription": response.data.transcript}, { status: 200 });
  } catch (error) {
    console.error("Error in audio transcription:", error);
    return NextResponse.json({ "error": "Failed to transcribe audio" }, { status: 500 });
  }
}