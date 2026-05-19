import { useCallback } from "react";

import { authApi, type LoginPayload, type SignupPayload } from "@/lib/api";

export function useAuthApi() {
  const signup = useCallback((payload: SignupPayload) => authApi.signup(payload), []);
  const login = useCallback((payload: LoginPayload) => authApi.login(payload), []);
  const logout = useCallback(() => authApi.logout(), []);
  const resendVerification = useCallback(() => authApi.resendVerification(), []);

  return {
    signup,
    login,
    logout,
    resendVerification,
  };
}
