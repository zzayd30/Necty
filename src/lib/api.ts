import axios, { AxiosError, AxiosResponse } from "axios";

import type { ApiResponse } from "@/lib/api-response";

export type ApiSerializableValue = string | number | string[] | null;

export type OnboardingData = Record<string, ApiSerializableValue>;

export type SignupPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type OnboardingProgressPayload = {
  step: number;
  data: OnboardingData;
};

export type OnboardingFinalizePayload = OnboardingData;

export type RedirectResponse = {
  redirectTo?: string;
};

export type MessageResponse = {
  message: string;
};

export type OkResponse = {
  ok: boolean;
};

export type BillingProduct = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  currency: string;
  unit_amount_cents: number;
  recurring_interval: "day" | "week" | "month" | "year";
  stripe_price_id: string | null;
};

export type ActiveBillingProductResponse = {
  product: BillingProduct | null;
};

export type OnboardingProgressResponse = {
  step: number;
  data: OnboardingData;
  completed: boolean;
};

export type ApiErrorBody = {
  success?: boolean;
  status?: number;
  message?: string;
  error?: string;
  data?: unknown;
};

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ApiErrorBody | string | undefined;

    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }

    if (responseData && typeof responseData === "object") {
      return responseData.error ?? responseData.message ?? fallback;
    }

    return fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

async function request<T>(promise: Promise<AxiosResponse<ApiResponse<T>>>, fallback: string) {
  try {
    const response = await promise;
    return response.data as ApiResponse<T>;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const payload = error.response.data as ApiResponse<T>;
      if (payload && typeof payload === "object" && "success" in payload) {
        return payload;
      }
    }
    throw new Error(getErrorMessage(error, fallback));
  }
}

export const authApi = {
  signup(payload: SignupPayload) {
    return request<RedirectResponse & MessageResponse>(apiClient.post<ApiResponse<RedirectResponse & MessageResponse>>("/auth/signup", payload), "Signup failed.");
  },
  login(payload: LoginPayload) {
    return request<RedirectResponse>(apiClient.post<ApiResponse<RedirectResponse>>("/auth/login", payload), "Login failed.");
  },
  logout() {
    return request<RedirectResponse & OkResponse>(apiClient.post<ApiResponse<RedirectResponse & OkResponse>>("/auth/logout"), "Logout failed.");
  },
  resendVerification(email?: string) {
    const payload = email ? { email } : {};
    return request<MessageResponse>(
      apiClient.post<ApiResponse<MessageResponse>>("/auth/resend-verification", payload),
      "Unable to resend verification."
    );
  },
  forgotPassword(payload: ForgotPasswordPayload) {
    return request<MessageResponse>(
      apiClient.post<ApiResponse<MessageResponse>>("/auth/forgot-password", payload),
      "Failed to send password reset link."
    );
  },
};

export const onboardingApi = {
  loadProgress() {
    return request<OnboardingProgressResponse>(
      apiClient.get<ApiResponse<OnboardingProgressResponse>>("/onboarding/progress", {
        headers: {
          "Cache-Control": "no-cache",
        },
      }),
      "Unable to load onboarding progress."
    );
  },
  saveProgress(payload: OnboardingProgressPayload) {
    return request<OkResponse>(
      apiClient.post<ApiResponse<OkResponse>>("/onboarding/progress", payload),
      "Unable to save onboarding progress."
    );
  },
  finalize(payload: OnboardingFinalizePayload) {
    return request<RedirectResponse>(
      apiClient.post<ApiResponse<RedirectResponse>>("/onboarding/finalize", payload),
      "Unable to finalize onboarding."
    );
  },
};

export const billingApi = {
  getActiveProduct() {
    return request<ActiveBillingProductResponse>(
      apiClient.get<ApiResponse<ActiveBillingProductResponse>>("/billing/active-product", {
        headers: {
          "Cache-Control": "no-cache",
        },
      }),
      "Unable to load billing product."
    );
  },
};
