import { Suspense } from "react";
import { VerifyEmailForm } from "./verify-email-form";

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
