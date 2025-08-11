jest.mock("@/models/dbOperations", () => ({
  getAllUsers: jest.fn(),
}));

import { GET } from "../route";
import { getAllUsers } from "@/models/dbOperations";
import { NextRequest } from "next/server";

describe("GET /api/company/[companyId]/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Successful Responses (200)", () => {
    it("returns 200 with users for valid companyId and default sort", async () => {
      const mockUsers = [
        {
          id: "1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          userType: "Employee",
          province: "ON",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          userType: "Owner",
          province: "BC",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      const params = Promise.resolve({ companyId: "company123" });
      const request = new Request("http://localhost:3000/api/company/company123/users");

      const response = await GET(request as NextRequest, { params });
      const result = await response.json();

      expect(getAllUsers).toHaveBeenCalledWith("company123", "firstName");
      expect(response.status).toBe(200);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        userType: "Employee",
        province: "ON",
      });
      expect(result[1]).toMatchObject({
        id: "2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        userType: "Owner",
        province: "BC",
      });
    });

    it("handles all valid sort parameters", async () => {
      const mockUsers = [
        {
          id: "1",
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          userType: "Administrator",
          province: "MB",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const validSorts = ["createdAt", "email", "firstName", "lastName", "province", "updatedAt", "userType"];

      for (const sort of validSorts) {
        (getAllUsers as jest.Mock).mockResolvedValue(mockUsers);
        const params = Promise.resolve({ companyId: "company789" });
        const request = new Request(`http://localhost:3000/api/company/company789/users?sort=${sort}`);

        const response = await GET(request as NextRequest, { params });
        const result = await response.json();

        expect(getAllUsers).toHaveBeenCalledWith("company789", sort);
        expect(response.status).toBe(200);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: "1",
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          userType: "Administrator",
          province: "MB",
        });
      }
    });

    it("returns empty array when no users found", async () => {
      (getAllUsers as jest.Mock).mockResolvedValue([]);

      const params = Promise.resolve({ companyId: "emptyCompany" });
      const request = new Request("http://localhost:3000/api/company/emptyCompany/users");

      const response = await GET(request as NextRequest, { params });
      const result = await response.json();

      expect(getAllUsers).toHaveBeenCalledWith("emptyCompany", "firstName");
      expect(response.status).toBe(200);
      expect(result).toEqual([]);
    });
  });

  describe("Input Validation (400)", () => {
    it("returns 400 for invalid sort parameter", async () => {
      const params = Promise.resolve({ companyId: "company123" });
      const request = new Request("http://localhost:3000/api/company/company123/users?sort=invalidSort");

      const response = await GET(request as NextRequest, { params });
      const result = await response.json();

      expect(getAllUsers).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(result).toEqual({ error: "Invalid sort parameter" });
    });

    it("returns 400 for empty sort parameter", async () => {
      const params = Promise.resolve({ companyId: "company123" });
      const request = new Request("http://localhost:3000/api/company/company123/users?sort=");

      const response = await GET(request as NextRequest, { params });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(getAllUsers).toHaveBeenCalledWith("company123", "firstName");
    });

    it("returns 400 for case-sensitive invalid sort", async () => {
      const params = Promise.resolve({ companyId: "company123" });
      const request = new Request("http://localhost:3000/api/company/company123/users?sort=FirstName");

      const response = await GET(request as NextRequest, { params });
      const result = await response.json();

      expect(getAllUsers).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(result).toEqual({ error: "Invalid sort parameter" });
    });
  });

  describe("Error Handling (404)", () => {
    it("returns 404 when getAllUsers returns null", async () => {
      (getAllUsers as jest.Mock).mockResolvedValue(null);

      const params = Promise.resolve({ companyId: "nonexistentCompany" });
      const request = new Request("http://localhost:3000/api/company/nonexistentCompany/users");

      const response = await GET(request as NextRequest, { params });
      const result = await response.json();

      expect(getAllUsers).toHaveBeenCalledWith("nonexistentCompany", "firstName");
      expect(response.status).toBe(404);
      expect(result).toEqual({ error: "No users found" });
    });

    it("returns 404 when getAllUsers returns undefined", async () => {
      (getAllUsers as jest.Mock).mockResolvedValue(undefined);

      const params = Promise.resolve({ companyId: "undefinedCompany" });
      const request = new Request("http://localhost:3000/api/company/undefinedCompany/users");

      const response = await GET(request as NextRequest, { params });
      const result = await response.json();

      expect(getAllUsers).toHaveBeenCalledWith("undefinedCompany", "firstName");
      expect(response.status).toBe(404);
      expect(result).toEqual({ error: "No users found" });
    });
  });

  describe("Error Handling (500)", () => {
    it("returns 500 when getAllUsers throws an error", async () => {
      (getAllUsers as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      const params = Promise.resolve({ companyId: "errorCompany" });
      const request = new Request("http://localhost:3000/api/company/errorCompany/users");

      const response = await GET(request as NextRequest, { params });
      const result = await response.json();

      expect(getAllUsers).toHaveBeenCalledWith("errorCompany", "firstName");
      expect(response.status).toBe(500);
      expect(result).toEqual({ error: "Failed to fetch users" });
    });

    it("returns 500 when getAllUsers throws a network error", async () => {
      (getAllUsers as jest.Mock).mockRejectedValue(
        new Error("Network timeout")
      );

      const params = Promise.resolve({ companyId: "networkErrorCompany" });
      const request = new Request("http://localhost:3000/api/company/networkErrorCompany/users");

      const response = await GET(request as NextRequest, { params });
      const result = await response.json();

      expect(getAllUsers).toHaveBeenCalledWith("networkErrorCompany", "firstName");
      expect(response.status).toBe(500);
      expect(result).toEqual({ error: "Failed to fetch users" });
    });
  });
});
