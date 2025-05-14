import { apiRequest } from "./queryClient";
import { User } from "./types";

export async function loginUser(email: string, password: string): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/login", { email, password });
  return response.json();
}

export async function registerUser(
  email: string,
  password: string,
  userData?: Record<string, any>
): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/register", {
    email,
    password,
    ...userData,
  });
  return response.json();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error("Failed to fetch current user");
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout", {});
}
