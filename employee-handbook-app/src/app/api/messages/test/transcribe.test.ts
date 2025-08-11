jest.mock("@/app/axios_config", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

import { POST } from "../transcribe/route";
import axiosInstance from "@/app/axios_config";
import { NextRequest } from "next/server";

describe("POST /api/messages/transcribe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AI_SERVICE_URL = "http://localhost:8000";
  });

  afterEach(() => {
    delete process.env.AI_SERVICE_URL;
  });

  describe("Successful Transcription (200)", () => {
    it("returns 200 with transcription for valid audio file", async () => {
      const mockResponse = {
        data: {
          transcript: "Hi I'm recording this to test our voice to text feature"
        }
      };
      (axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      // mock FormData with audio file
      const formData = new FormData();
      const audioBlob = new Blob(["mock audio data"], { type: "audio/m4a" });
      formData.append("file", audioBlob);

      const request = new Request("http://localhost:3000/api/messages/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request as NextRequest);
      const result = await response.json();

      expect(axiosInstance.post).toHaveBeenCalledWith(
        "http://localhost:8000/transcribe",
        expect.any(FormData)
      );
      expect(response.status).toBe(200);
      expect(result).toEqual({
        message: "Audio transcribed successfully",
        transcription: "Hi I'm recording this to test our voice to text feature"
      });
    });

    it("returns 200 with transcription for question audio", async () => {
      const mockResponse = {
        data: {
          transcript: "What is the minimum wage in Ontario?"
        }
      };
      (axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const formData = new FormData();
      const audioBlob = new Blob(["mock question audio"], { type: "audio/m4a" });
      formData.append("file", audioBlob);

      const request = new Request("http://localhost:3000/api/messages/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request as NextRequest);
      const result = await response.json();

      expect(axiosInstance.post).toHaveBeenCalledWith(
        "http://localhost:8000/transcribe",
        expect.any(FormData)
      );
      expect(response.status).toBe(200);
      expect(result).toEqual({
        message: "Audio transcribed successfully",
        transcription: "What is the minimum wage in Ontario?"
      });
    });

    it("handles different audio file types", async () => {
      const mockResponse = {
        data: {
          transcript: "Testing different audio format"
        }
      };
      (axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const formData = new FormData();
      const audioBlob = new Blob(["mock audio data"], { type: "audio/wav" });
      formData.append("file", audioBlob);

      const request = new Request("http://localhost:3000/api/messages/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.transcription).toBe("Testing different audio format");
    });
  });

  describe("Error Handling (500)", () => {
    it("returns 500 when AI service is unavailable", async () => {
      (axiosInstance.post as jest.Mock).mockRejectedValue(
        new Error("Network Error")
      );

      const formData = new FormData();
      const audioBlob = new Blob(["mock audio data"], { type: "audio/m4a" });
      formData.append("file", audioBlob);

      const request = new Request("http://localhost:3000/api/messages/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result).toEqual({
        error: "Failed to transcribe audio"
      });
    });

    it("returns 500 when AI service returns error", async () => {
      (axiosInstance.post as jest.Mock).mockRejectedValue(
        new Error("AI Service Error")
      );

      const formData = new FormData();
      const audioBlob = new Blob(["mock audio data"], { type: "audio/m4a" });
      formData.append("file", audioBlob);

      const request = new Request("http://localhost:3000/api/messages/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result).toEqual({
        error: "Failed to transcribe audio"
      });
    });

    it("returns 500 when AI service returns invalid response format", async () => {
      const mockResponse = {
        data: {
          // missing transcript field
          error: "Invalid audio format"
        }
      };
      (axiosInstance.post as jest.Mock).mockResolvedValue(mockResponse);

      const formData = new FormData();
      const audioBlob = new Blob(["mock audio data"], { type: "audio/m4a" });
      formData.append("file", audioBlob);

      const request = new Request("http://localhost:3000/api/messages/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.transcription).toBeUndefined();
    });
  });

  describe("Input Validation", () => {
    it("handles empty FormData", async () => {
      (axiosInstance.post as jest.Mock).mockRejectedValue(
        new Error("No file provided")
      );

      const formData = new FormData();
      const request = new Request("http://localhost:3000/api/messages/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result).toEqual({
        error: "Failed to transcribe audio"
      });
    });

    it("handles malformed FormData", async () => {
      (axiosInstance.post as jest.Mock).mockRejectedValue(
        new Error("Invalid form data")
      );

      const formData = new FormData();
      formData.append("invalid_field", "not_audio");
      
      const request = new Request("http://localhost:3000/api/messages/transcribe", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result).toEqual({
        error: "Failed to transcribe audio"
      });
    });
  });
});
