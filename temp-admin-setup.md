# Quick Admin Setup

## Option 1: Manual Database Entry (Recommended)

1. Register a test student account first to see how it works
2. Then I'll help you create a script to add admin accounts directly to Firestore

## Option 2: Temporary Registration Modification

If you need admin access immediately:

1. Temporarily modify the email validation in `server/src/utils/validation.ts`
2. Change the student email check to allow @tce.edu
3. Register with your @tce.edu email
4. Restore the original validation

## Option 3: Environment Override

We can add a special environment variable to allow one admin registration during setup.

Which option would you prefer?
