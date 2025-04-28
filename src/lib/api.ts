// frontend/src/lib/api.ts
import { LoginCredentials, User } from "../types/user";
import { Stock } from "../types/stock";
import {
  Trade,
  CreateTradeRequest,
  UpdateTradeRequest,
  SellTradeRequest,
} from "../types/trade";
import { NotificationPreferences } from "../types/notification";
import { PriceAlert, CreatePriceAlertRequest } from "../types/alert";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const user = JSON.parse(localStorage.getItem("user") || "{}") as User;

  if (user.token) {
    console.log("Using token for request:", url);
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${user.token}`,
    };
  } else {
    console.warn("No token found for request:", url);
  }

  const response = await fetch(url, options);

  if (response.status === 401) {
    console.error("Unauthorized request:", url);
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  return response;
}

export async function login(credentials: LoginCredentials): Promise<User> {
  console.log("API login function called with:", credentials.username);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    console.log("Login response status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("Login error response:", error);
      throw new Error(error || "Login failed");
    }

    const user = await response.json();
    console.log("Login successful, user data:", user);

    // Save to localStorage
    localStorage.setItem("user", JSON.stringify(user));
    console.log("User saved to localStorage");

    return user;
  } catch (error) {
    console.error("API login error:", error);
    throw error;
  }
}

export async function register(credentials: LoginCredentials): Promise<User> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Registration failed");
  }

  const user = await response.json();
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

export async function logout(): Promise<void> {
  localStorage.removeItem("user");
}

// Stocks API
export async function getStocks(): Promise<Stock[]> {
  const response = await fetchWithAuth(`${API_URL}/stocks`);

  if (!response.ok) {
    throw new Error("Failed to fetch stocks");
  }

  return response.json();
}

export async function getStock(id: number): Promise<Stock> {
  const response = await fetchWithAuth(`${API_URL}/stocks/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch stock");
  }

  return response.json();
}

export async function getStockPrices(): Promise<
  Array<{ id: number; symbol: string; price: number }>
> {
  const response = await fetchWithAuth(`${API_URL}/stocks/prices`);

  if (!response.ok) {
    throw new Error("Failed to fetch stock prices");
  }

  return response.json();
}

export async function getStockHistory(
  id: number
): Promise<{ date: string; price: number }[]> {
  const response = await fetchWithAuth(`${API_URL}/stocks/${id}/history`);

  if (!response.ok) {
    throw new Error("Failed to fetch stock history");
  }

  return response.json();
}

// Trades API
export async function getTrades(): Promise<Trade[]> {
  const response = await fetchWithAuth(`${API_URL}/trades`);

  if (!response.ok) {
    throw new Error("Failed to fetch trades");
  }

  return response.json();
}

export async function getTrade(id: number): Promise<Trade> {
  const response = await fetchWithAuth(`${API_URL}/trades/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch trade");
  }

  return response.json();
}

export async function createTrade(trade: CreateTradeRequest): Promise<Trade> {
  const response = await fetchWithAuth(`${API_URL}/trades`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(trade),
  });

  if (!response.ok) {
    throw new Error("Failed to create trade");
  }

  return response.json();
}

export async function updateTrade(
  id: number,
  trade: UpdateTradeRequest
): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/trades/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(trade),
  });

  if (!response.ok) {
    throw new Error("Failed to update trade");
  }
}

export async function sellTrade(id: number, pnl: number): Promise<void> {
  const sellRequest: SellTradeRequest = {
    pnl: pnl,
    isHolding: false,
  };

  const response = await fetchWithAuth(`${API_URL}/trades/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sellRequest),
  });

  if (!response.ok) {
    throw new Error("Failed to sell trade");
  }
}

export async function deleteTrade(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/trades/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete trade");
  }
}

// Notifications API
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await fetchWithAuth(`${API_URL}/notifications/preferences`);

  if (!response.ok) {
    throw new Error("Failed to fetch notification preferences");
  }

  return response.json();
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences
): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/notifications/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    let errorMessage = "Failed to update notification preferences";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      console.error("Error parsing response text:", e);
      try {
        errorMessage = (await response.text()) || errorMessage;
      } catch (e) {
        console.error("Error parsing response text:", e);
      }
    }
    console.error("API Error:", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function sendTestNotification(): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/notifications/test`, {
    method: "POST",
  });

  if (!response.ok) {
    let errorMessage = "Failed to send test notification";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      console.error("Error parsing response text:", e);
      try {
        errorMessage = (await response.text()) || errorMessage;
      } catch (e) {
        console.error("Error parsing response text:", e);
      }
    }
    console.error("API Error:", errorMessage);
    throw new Error(errorMessage);
  }
}

// Price Alerts API
export async function getPriceAlerts(): Promise<PriceAlert[]> {
  const response = await fetchWithAuth(`${API_URL}/pricealerts`);

  if (!response.ok) {
    throw new Error("Failed to fetch price alerts");
  }

  return response.json();
}

export async function createPriceAlert(
  alert: CreatePriceAlertRequest
): Promise<PriceAlert> {
  const response = await fetchWithAuth(`${API_URL}/pricealerts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(alert),
  });

  if (!response.ok) {
    throw new Error("Failed to create price alert");
  }

  return response.json();
}

export async function deletePriceAlert(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/pricealerts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete price alert");
  }
}
