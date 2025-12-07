import { POST } from "./route";
import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { db } from "@/lib/db";
import { getUserPermission } from "@/lib/usersFunction";

// Mock all dependencies
jest.mock("@/lib/auth", () => ({
    auth: {
        api: {
            getSession: jest.fn(),
        },
    },
}));

jest.mock("@/lib/auth-client", () => ({
    authClient: {
        signUp: {
            email: jest.fn(),
        },
    },
}));

jest.mock("@/lib/db", () => ({
    db: {
        transaction: jest.fn(),
    },
}));

jest.mock("@/lib/usersFunction", () => ({
    getUserPermission: jest.fn(),
}));

describe("POST /api/users", () => {
    // Get the mocked functions
    const mockGetSession = auth.api.getSession as jest.Mock;
    const mockSignUpEmail = authClient.signUp.email as jest.Mock;
    const mockDbTransaction = db.transaction as jest.Mock;
    const mockGetUserPermission = getUserPermission as jest.Mock;

    // Helper to create mock Request
    const createMockRequest = (body: any, headers: HeadersInit = {}) => {
        return new Request("http://localhost:3000/api/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify(body),
        });
    };

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe("Authentication", () => {
        it("should return 401 when user is not logged in", async () => {
            // Arrange
            mockGetSession.mockResolvedValue(null);
            const request = createMockRequest({
                email: "test@example.com",
                name: "Test User",
            });

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(401);
            expect(data).toEqual({ error: "unauthorized" });
            expect(mockGetSession).toHaveBeenCalledWith({
                headers: request.headers,
            });
        });

        it("should return 401 when user is not an admin", async () => {
            // Arrange
            const mockSession = {
                user: {
                    id: "user123",
                    email: "test@example.com",
                    name: "Test User",
                },
                session: { id: "session123" },
            };
            mockGetSession.mockResolvedValue(mockSession);
            mockGetUserPermission.mockReturnValue(false);

            const request = createMockRequest({
                email: "newuser@example.com",
                name: "New User",
            });

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(401);
            expect(data).toEqual({ error: "unauthorized" });
            expect(mockGetUserPermission).toHaveBeenCalledWith("user123");
        });
    });

    describe("Successful User Creation", () => {
        it("should create a new user successfully", async () => {
            // Arrange
            const mockSession = {
                user: {
                    id: "admin123",
                    email: "admin@example.com",
                    name: "Admin User",
                },
                session: { id: "session123" },
            };
            const newUserData = {
                email: "newuser@example.com",
                name: "New User",
            };
            const mockNewUser = {
                data: {
                    user: {
                        id: "newuser456",
                        email: newUserData.email,
                        name: newUserData.name,
                    },
                },
            };

            const mockInsert = jest.fn().mockReturnValue({
                values: jest.fn().mockResolvedValue(undefined),
            });

            const mockTransaction = jest.fn(async (callback: any) => {
                const tx = { insert: mockInsert };
                return callback(tx);
            });

            mockGetSession.mockResolvedValue(mockSession);
            mockGetUserPermission.mockReturnValue(true);
            mockSignUpEmail.mockResolvedValue(mockNewUser);
            mockDbTransaction.mockImplementation(mockTransaction);

            const request = createMockRequest(newUserData);

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(201);
            expect(data).toEqual({
                success: true,
                userId: "newuser456",
                userInfoId: expect.any(String),
            });
            expect(mockGetSession).toHaveBeenCalled();
            expect(mockGetUserPermission).toHaveBeenCalledWith("admin123");
            expect(mockSignUpEmail).toHaveBeenCalledWith({
                email: newUserData.email,
                password: expect.any(String),
                name: newUserData.name,
            });
            expect(mockDbTransaction).toHaveBeenCalled();

            // Verify userInfo insert was called with correct data
            const valuesCall =
                mockInsert.mock.results[0].value.values.mock.calls[0][0];
            expect(valuesCall).toEqual({
                id: expect.any(String), // ID should be generated (UUID)
                userId: "newuser456",
                authorized: false,
                permissions: "none",
            });

            // Verify both the id and password are UUID format
            expect(valuesCall.id).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            );

            const signUpCall = mockSignUpEmail.mock.calls[0][0];
            expect(signUpCall.password).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            );
        });
    });

    describe("Error Handling", () => {
        beforeEach(() => {
            // Setup successful auth for error tests
            const mockSession = {
                user: {
                    id: "admin123",
                    email: "admin@example.com",
                    name: "Admin User",
                },
                session: { id: "session123" },
            };
            mockGetSession.mockResolvedValue(mockSession);
            mockGetUserPermission.mockReturnValue(true);
        });

        it("should return error when authClient.signUp returns no data", async () => {
            // Arrange
            mockSignUpEmail.mockResolvedValue({ data: null });
            const request = createMockRequest({
                email: "test@example.com",
                name: "Test User",
            });

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(data).toEqual({ error: "error" });
        });

        it("should return error when authClient.signUp throws an exception", async () => {
            // Arrange
            mockSignUpEmail.mockRejectedValue(new Error("Sign up failed"));
            const request = createMockRequest({
                email: "test@example.com",
                name: "Test User",
            });

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(data).toEqual({ error: "error" });
        });

        it("should return error when database transaction fails", async () => {
            // Arrange
            const mockNewUser = {
                data: {
                    user: {
                        id: "newuser456",
                        email: "test@example.com",
                        name: "Test User",
                    },
                },
            };
            mockSignUpEmail.mockResolvedValue(mockNewUser);
            mockDbTransaction.mockRejectedValue(new Error("DB Error"));

            const request = createMockRequest({
                email: "test@example.com",
                name: "Test User",
            });

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(data).toEqual({ error: "error" });
        });

        it("should handle malformed request body", async () => {
            // Arrange
            mockSignUpEmail.mockRejectedValue(new Error("Invalid email"));
            const request = createMockRequest({ invalid: "data" });

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(data).toEqual({ error: "error" });
        });
    });

    describe("Request Body Validation", () => {
        beforeEach(() => {
            const mockSession = {
                user: {
                    id: "admin123",
                    email: "admin@example.com",
                    name: "Admin User",
                },
                session: { id: "session123" },
            };
            mockGetSession.mockResolvedValue(mockSession);
            mockGetUserPermission.mockReturnValue(true);
        });

        it("should correctly pass email and name from request body", async () => {
            // Arrange
            const userData = {
                email: "specific@example.com",
                name: "Specific Name",
            };
            mockSignUpEmail.mockResolvedValue({
                data: {
                    user: {
                        id: "user123",
                        email: userData.email,
                        name: userData.name,
                    },
                },
            });
            mockDbTransaction.mockImplementation(async (callback: any) => {
                const tx = {
                    insert: jest.fn().mockReturnValue({
                        values: jest.fn().mockResolvedValue(undefined),
                    }),
                };
                return callback(tx);
            });

            const request = createMockRequest(userData);

            // Act
            await POST(request);

            // Assert
            expect(mockSignUpEmail).toHaveBeenCalledWith({
                email: userData.email,
                password: expect.any(String),
                name: userData.name,
            });
        });
    });
});
