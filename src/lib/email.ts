import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Necty <onboarding@xaviboost.com>";

export async function sendVerificationEmail(email: string, link: string) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your Necty account",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to Necty!</h2>
        <p>Thank you for signing up. Please verify your email address to get started and set up your workspace.</p>

        <div style="margin: 30px 0;">
          <a href="${link}"
             style="background:#4f46e5;color:white;padding:12px 24px;
             text-decoration:none;border-radius:6px;font-weight:600;">
            Verify Email Address
          </a>
        </div>

        <p style="color:#666;font-size:12px;">
          If you did not sign up for Necty, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message);
  }

  return data;
}