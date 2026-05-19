import { useCallback } from "react";

import { billingApi } from "@/lib/api";

export function useBillingApi() {
  const getActiveProduct = useCallback(() => billingApi.getActiveProduct(), []);

  return {
    getActiveProduct,
  };
}
