# M4 End-to-End Demo Testing Guide

This guide outlines the critical paths that must be manually tested to ensure M4 components (Forms, Tables, Workflows) integrate correctly with M2's Supabase hooks or mock data before the final demo.

## Prerequisites
1. Ensure the `ToastProvider` is wrapped around the root component (App.jsx).
2. Ensure React Query `QueryClientProvider` is configured and M2 hooks are wired up.

---

## Flow 1: Organization Setup
1. **Action**: Navigate to Organization Setup.
2. **Test**: Submit a new Department with a parent department selected.
3. **Expected**: 
   - Zod validation prevents submission without a name.
   - Successful submission triggers a green toast (`toast.success`).
   - The React Query hook invalidates, and the new department appears in the list.

## Flow 2: Asset Registration & File Upload
1. **Action**: Open the Asset Registration form.
2. **Test**: Upload a file larger than 10MB.
3. **Expected**: UI blocks upload with an inline error ("Files must be 10 MB or smaller").
4. **Test**: Fill out all fields, select a valid 2MB image, and submit.
5. **Expected**: 
   - Image uploads to Supabase Storage.
   - Asset row is inserted via M2 hook.
   - Form resets on success.

## Flow 3: Asset Directory & Allocation Conflict
1. **Action**: Navigate to Asset Directory.
2. **Test**: Search for an asset and use the category filter.
3. **Expected**: Table filters results dynamically.
4. **Test**: Click "Allocate" on an *Available* asset, select an employee, and submit.
5. **Expected**: Status changes to Allocated.
6. **Test**: Click "Allocate" on an *Allocated* asset.
7. **Expected**: System blocks simple allocation, displaying the "Allocation Conflict State" UI, and offers the "Request Transfer" button instead.

## Flow 4: Maintenance Lifecycle
1. **Action**: Submit a new Maintenance Request via the M4 form.
2. **Test**: Navigate to the Maintenance Approval Queue.
3. **Expected**: New request appears as "Pending".
4. **Test**: Manage status -> Reject without notes.
5. **Expected**: Zod prevents submission ("Provide a reason for rejecting").
6. **Test**: Manage status -> Assign a technician and move to "In Progress".
7. **Expected**: Status updates successfully.

## Flow 5: Audit Verification
1. **Action**: Create an Audit Cycle via the form. Assign yourself as an auditor.
2. **Test**: Open the Asset Verification Workflow.
3. **Expected**: Dashboard KPIs at the top show total pending assets.
4. **Test**: Verify an asset as "Missing" without providing notes.
5. **Expected**: Zod prevents submission.
6. **Test**: Add notes and verify as "Missing".
7. **Expected**: KPI counters update (Pending decreases, Missing increases). Row status turns red.

---
**Sign-off**: Once all flows pass without console errors or unhandled promise rejections, M4 is ready for the main branch merge.
