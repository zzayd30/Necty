import { useCallback } from "react";

import { authApi, type LoginPayload, type SignupPayload, type ForgotPasswordPayload } from "@/lib/api";

export function useAuthApi() {
  const signup = useCallback((payload: SignupPayload) => authApi.signup(payload), []);
  const login = useCallback((payload: LoginPayload) => authApi.login(payload), []);
  const logout = useCallback(() => authApi.logout(), []);
  const resendVerification = useCallback((email?: string) => authApi.resendVerification(email), []);
  const forgotPassword = useCallback((payload: ForgotPasswordPayload) => authApi.forgotPassword(payload), []);

  return {
    signup,
    login,
    logout,
    resendVerification,
    forgotPassword,
  };
}
