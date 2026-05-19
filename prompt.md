
# 🧭 Authentication & Onboarding Flow Architecture (NECTY)

This document defines the redesigned authentication and onboarding system flow. The goal is to separate **account creation**, **email verification**, and **workspace initialization** into clean, scalable stages.

---

# 🚀 Overview

The system is divided into **3 main phases**:

1. **Signup Phase (Account Creation Only)**
2. **Email Verification Phase**
3. **Onboarding Phase (Workspace Setup)**

---

# 1️⃣ Signup Phase (Account Creation Only)

## 🎯 Goal

Create a user account and send verification email only. No workspace or onboarding data is created at this stage.

## ⚙️ Process

When a user signs up:

- Create user using Supabase Admin Auth API
- Do NOT create:
  - workspace
  - workspace_members
  - onboarding_progress
- Generate email verification link manually
- Send verification email using external provider (e.g., Resend)

## 🧾 Allowed Operations

- `auth.users` → create user
- generate verification link
- send email

## ❌ Not Allowed

- workspace creation
- onboarding initialization
- member assignment

## 📤 Output

- User created in Supabase Auth
- Verification email sent
- User is in **unverified state**

---

# 2️⃣ Email Verification Phase

## 🎯 Goal

Verify the user and allow them to access onboarding.

## ⚙️ Process

When user clicks verification link:

- Supabase verifies the email
- User session is established
- User is redirected to:
