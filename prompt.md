
You are working inside a Next.js 13+ App Router SaaS application using Supabase Auth.

I need you to implement a COMPLETE authentication + onboarding system with workspace creation and onboarding persistence.

We are using:

- Next.js App Router
- TypeScript
- Supabase Auth
- Supabase PostgreSQL database
- Multi-tenant workspace architecture

DO NOT create a custom users table because Supabase auth.users is already being used.

==================================================
AUTHENTICATION FLOW
===================

The user signup flow should work like this:

1. User enters:

   - full name
   - email
   - password
2. Create Supabase auth user using email/password signup
3. Immediately after signup:

   - create a workspace
   - insert owner into workspace_members
   - create onboarding progress record
4. The user should be allowed to continue onboarding EVEN IF email is not verified yet.
5. The system should send a verification email in the background.
6. The user can complete onboarding steps before verifying email.
7. The user MUST verify email before accessing the main dashboard/features.

==================================================
IMPORTANT UX REQUIREMENT
========================

DO NOT force email verification before onboarding.

Correct flow:

Signup
→ Workspace creation
→ Start onboarding
→ Save onboarding progress
→ Verify email
→ Unlock dashboard

==================================================
DATABASE TABLES
===============

We already have these tables:

1. workspaces
2. workspace_members
3. workspace_invitations
4. profiles

I ALSO need a new onboarding tracking table.

Create a table similar to:

- onboarding_progress
  OR
- onboarding_steps

This table should:

- track current onboarding step
- track completed steps
- allow resuming onboarding later
- persist progress if user leaves midway
- support total onboarding flow of 9 steps

==================================================
IMPORTANT DATABASE REQUIREMENT
==============================

Provide ALL SQL QUERIES required for:

- creating onboarding table
- creating indexes if needed
- constraints
- relationships with auth.users

Also provide any ALTER TABLE queries if existing tables need modification.

==================================================
ONBOARDING TABLE REQUIREMENTS
=============================

The onboarding table should support:

- user_id (references auth.users)
- workspace_id
- current_step
- completed_steps
- onboarding_completed
- timestamps

The user should be able to:

- leave onboarding midway
- login later
- continue from exact previous step

==================================================
SUBSCRIPTION / BILLING REQUIREMENT
==================================

Currently the subscription plan data is hardcoded in the frontend.

I want this moved into the database properly.

Create a products/subscription plans table and create a seeder for the initial product.

The system should support future scalability for multiple plans.

==================================================
PRODUCT DETAILS
===============

Create an initial subscription product with these details:

- currency: 'usd'
- name: 'NECTY Pro'
- description: 'NECTY Pro monthly subscription'
- unit_amount: 199.99
- recurring interval: 'month'

==================================================
PRODUCT TABLE REQUIREMENTS
==========================

Create a table similar to:

- subscription_products
  OR
- billing_products

The table should support:

- product name
- description
- currency
- amount
- recurring interval
- active/inactive status
- Stripe product id
- Stripe price id
- timestamps

==================================================
SEEDER REQUIREMENT
==================

Create:

- SQL seeder query
  OR
- TypeScript seeder script

that inserts the initial "NECTY Pro" product into the database.

The seeder should be reusable and idempotent if possible.

==================================================
AUTH REQUIREMENTS
=================

Implement:

1. Signup
2. Login
3. Logout
4. Session handling
5. Protected dashboard routes
6. Middleware protection
7. Email verification check

==================================================
EMAIL VERIFICATION LOGIC
========================

Users should:

- be allowed into onboarding without verification
- NOT be allowed into main dashboard until verified

Middleware should check:

- authenticated user
- email_confirmed_at

If email is not verified:
→ redirect to /verify-email

==================================================
PROJECT STRUCTURE
=================

Implement or modify:

- lib/supabaseClient.ts
- app/(auth)/signup/page.tsx
- app/(auth)/login/page.tsx
- app/onboarding/*
- app/dashboard/page.tsx
- middleware.ts
- server actions or API routes for auth
- database schema files
- seed scripts

==================================================
TECH REQUIREMENTS
=================

- Use clean TypeScript
- Use Supabase JS SDK
- Use server actions where appropriate
- Separate UI from business logic
- Proper error handling
- Production-ready structure
- Scalable architecture for future multi-workspace support

==================================================
EXPECTED RESULT
===============

Implement a fully working authentication and onboarding system where:

- signup creates auth user
- workspace is automatically created
- owner is inserted into workspace_members
- onboarding progress is saved
- users can resume onboarding later
- email verification is enforced only before dashboard access
- subscription plans are stored in database
- product seeder exists for initial NECTY Pro plan
- middleware protects routes properly

Also provide all SQL queries needed for Supabase setup.
