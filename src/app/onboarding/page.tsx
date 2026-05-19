import { redirect } from "next/navigation";
import PageContent from "./pageContent";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;

  console.log("[onboarding] params:", params);

  const sessionId = params.session_id;

  if (sessionId) {
    console.log(
      "[onboarding] redirecting:",
      sessionId
    );

    redirect(
      `/dashboard?session_id=${encodeURIComponent(
        sessionId
      )}`
    );
  }

  return <PageContent />;
}