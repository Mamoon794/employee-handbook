jest.mock("@/models/dbOperations", () => ({
  getUser: jest.fn(),
  getClerkUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));
jest.mock("@/lib/sentry", () => ({
  Sentry: { captureException: jest.fn() },
}));

import { GET, PATCH, DELETE } from "../route";
import { getUser, getClerkUser, updateUser, deleteUser } from "@/models/dbOperations";
import { Sentry } from "@/lib/sentry";

global.Response = Response;

describe("[userID] API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 200 and user for valid userID", async () => {
      (getUser as jest.Mock).mockResolvedValue({ id: "1", name: "Test" });
      const params = Promise.resolve({ userID: "1" });
      const req = new Request("http://localhost");
      const res = await GET(req, { params });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ id: "1", name: "Test" });
    });

    it("returns 200 and user for valid clerkID", async () => {
      (getClerkUser as jest.Mock).mockResolvedValue({ id: "2", name: "Clerk" });
      const params = Promise.resolve({ userID: "2" });
      const req = new Request("http://localhost?isClerkID=true");
      const res = await GET(req, { params });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ id: "2", name: "Clerk" });
    });

    it("returns 404 if user not found", async () => {
      (getUser as jest.Mock).mockResolvedValue(null);
      const params = Promise.resolve({ userID: "3" });
      const req = new Request("http://localhost");
      const res = await GET(req, { params });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toEqual({ error: "User not found" });
    });

    it("returns 500 on error", async () => {
      (getUser as jest.Mock).mockRejectedValue(new Error("fail"));
      const params = Promise.resolve({ userID: "4" });
      const req = new Request("http://localhost");
      const res = await GET(req, { params });
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toEqual({ error: "Failed to fetch user" });
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe("PATCH", () => {
    it("returns 400 for invalid userType", async () => {
      const params = Promise.resolve({ userID: "1" });
      const req = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ userType: "Invalid" }),
      });
      req.json = async () => ({ userType: "Invalid" });
      const res = await PATCH(req, { params });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toEqual({ error: "Invalid user type" });
    });

    it("returns 200 and user for valid update", async () => {
      (updateUser as jest.Mock).mockResolvedValue({ id: "1", userType: "Employee" });
      const params = Promise.resolve({ userID: "1" });
      const req = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ userType: "Employee" }),
      });
      req.json = async () => ({ userType: "Employee" });
      const res = await PATCH(req, { params });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ id: "1", userType: "Employee" });
    });

    it("returns 404 if user not found on update", async () => {
      (updateUser as jest.Mock).mockResolvedValue(null);
      const params = Promise.resolve({ userID: "2" });
      const req = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ userType: "Owner" }),
      });
      req.json = async () => ({ userType: "Owner" });
      const res = await PATCH(req, { params });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toEqual({ error: "User not found" });
    });

    it("returns 500 on update error", async () => {
      (updateUser as jest.Mock).mockRejectedValue(new Error("fail"));
      const params = Promise.resolve({ userID: "3" });
      const req = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ userType: "Owner" }),
      });
      req.json = async () => ({ userType: "Owner" });
      const res = await PATCH(req, { params });
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toEqual({ error: "Failed to update user" });
    });
  });

  describe("DELETE", () => {
    it("returns 204 for successful delete", async () => {
      (deleteUser as jest.Mock).mockResolvedValue(true);
      const params = Promise.resolve({ userID: "1" });
      const req = new Request("http://localhost", { method: "DELETE" });
      const res = await DELETE(req, { params });
      expect(res.status).toBe(204);
    });

    it("returns 404 if user not found on delete", async () => {
      (deleteUser as jest.Mock).mockResolvedValue(false);
      const params = Promise.resolve({ userID: "2" });
      const req = new Request("http://localhost", { method: "DELETE" });
      const res = await DELETE(req, { params });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toEqual({ error: "User not found" });
    });

    it("returns 500 on delete error", async () => {
      (deleteUser as jest.Mock).mockRejectedValue(new Error("fail"));
      const params = Promise.resolve({ userID: "3" });
      const req = new Request("http://localhost", { method: "DELETE" });
      const res = await DELETE(req, { params });
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toEqual({ error: "Failed to delete user" });
    });
  });
});
