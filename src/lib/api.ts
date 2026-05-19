import axios, { AxiosError, AxiosResponse } from "axios";

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

export type OnboardingProgressPayload = {
  step: number;
  data: OnboardingData;
};

export type OnboardingFinalizePayload = OnboardingData;

export type RedirectResponse = {
  redirectTo?: string;
};

export type MessageResponse = {
  message?: string;
};

export type OkResponse = {
  ok?: boolean;
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
  error?: string;
  message?: string;
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

async function request<T>(promise: Promise<AxiosResponse<T>>, fallback: string) {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
}

export const authApi = {
  signup(payload: SignupPayload) {
    return request<RedirectResponse>(apiClient.post("/auth/signup", payload), "Signup failed.");
  },
  login(payload: LoginPayload) {
    return request<RedirectResponse>(apiClient.post("/auth/login", payload), "Login failed.");
  },
  logout() {
    return request<RedirectResponse & OkResponse>(apiClient.post("/auth/logout"), "Logout failed.");
  },
  resendVerification() {
    return request<MessageResponse>(
      apiClient.post("/auth/resend-verification"),
      "Unable to resend verification."
    );
  },
};

export const onboardingApi = {
  loadProgress() {
    return request<OnboardingProgressResponse>(
      apiClient.get("/onboarding/progress", {
        headers: {
          "Cache-Control": "no-cache",
        },
      }),
      "Unable to load onboarding progress."
    );
  },
  saveProgress(payload: OnboardingProgressPayload) {
    return request<OkResponse>(
      apiClient.post("/onboarding/progress", payload),
      "Unable to save onboarding progress."
    );
  },
  finalize(payload: OnboardingFinalizePayload) {
    return request<RedirectResponse>(
      apiClient.post("/onboarding/finalize", payload),
      "Unable to finalize onboarding."
    );
  },
};

export const billingApi = {
  getActiveProduct() {
    return request<ActiveBillingProductResponse>(
      apiClient.get("/billing/active-product", {
        headers: {
          "Cache-Control": "no-cache",
        },
      }),
      "Unable to load billing product."
    );
  },
};
