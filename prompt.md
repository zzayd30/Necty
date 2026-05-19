
I'm facing a redirect loop issue in a Next.js 15 App Router project after Stripe checkout.

Current flow:

* Stripe redirects to:
  `/onboarding?session_id={CHECKOUT_SESSION_ID}`

My `app/onboarding/page.tsx` is a Server Component and uses async `searchParams`:

```tsx
import { redirect } from "next/navigation";
import PageContent from "./pageContent";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  console.log("[onboarding] params:", params);

  if (sessionId) {
    console.log("[onboarding] redirecting:", sessionId);

    redirect(
      `/dashboard?session_id=${encodeURIComponent(sessionId)}`
    );
  }

  return <PageContent />;
}
```

Server logs confirm:

```txt
[onboarding] params: {session_id: "..."}
[onboarding] redirecting: ...
```

So the server redirect code executes.

However the browser does NOT navigate. Instead I get:

```txt
Throttling navigation to prevent the browser from hanging
replaceState @ app-router.tsx
```

I also noticed `pageContent.tsx` mounts repeatedly:

```txt
mount
mount
redirecting
mount
mount
```

There may also be client-side redirect logic using `router.push`, `router.replace`, `window.location`, `useSearchParams`, or `useEffect`.

I suspect an infinite navigation loop where:

1. `/onboarding?session_id=xxx`
2. server redirects → `/dashboard?session_id=xxx`
3. client code redirects again
4. app-router repeatedly calls replaceState
5. browser throttles navigation

Please inspect the onboarding and dashboard flow and identify:

* all redirect/navigation calls
* client redirects in `pageContent.tsx`
* redirect loops in `dashboard`
* useEffect dependencies causing repeated navigation
* StrictMode double mounting issues
* any App Router misuse in Next.js 15

Suggest the exact code changes needed to stop the loop and make the server redirect work properly.
