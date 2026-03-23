# RPC Functions Audit

This document tracks all PostgreSQL RPC (Remote Procedure Call) functions used in the codebase and their implementation status.

## Summary
- **Total RPC Calls Found**: 7
- **Replaced with Direct Queries**: 6
- **Need Implementation**: 1 (delete_user - should be SQL function)

---

## RPC Functions Used in Codebase

### 1. `can_send_message` (FIXED)
**Location**: Previously in `server/api/messages/index.post.ts:31`
**Purpose**: Check if a user can send a message in a job conversation
**Parameters**: 
- `p_job_id`: UUID
- `p_sender_id`: UUID
- `p_receiver_id`: UUID

**Status**: ✅ REPLACED with direct query
**Fix Applied**: Lines 32-86 now use direct queries to:
- Verify application exists
- Check sender is worker or employer
- Check receiver is the other party
- Prevent self-messaging

---

### 2. `find_jobs_near`
**Location**: `server/api/jobs/near.get.ts:34`
**Purpose**: Find jobs near a geographic location
**Parameters**:
- `search_lat`: number
- `search_lng`: number
- `distance_km`: number

**Status**: ❌ NOT IMPLEMENTED
**Action Required**: Create SQL function with PostGIS or replace with direct query

---

### 3. `get_job_application_stats`
**Location**: `server/api/applications/job/[id]/stats.get.ts:28`
**Purpose**: Get application statistics for a job (total, pending, accepted, rejected)
**Parameters**:
- `job_uuid`: UUID

**Status**: ❌ NOT IMPLEMENTED
**Action Required**: Replace with direct aggregation query

---

### 4. `get_job_applications`
**Location**: `server/api/applications/job/[id].get.ts:28`
**Purpose**: Get all applications for a specific job
**Parameters**:
- `job_uuid`: UUID

**Status**: ❌ NOT IMPLEMENTED
**Action Required**: Replace with direct query (similar to what was done for `get_worker_applications`)

---

### 5. `can_apply_to_job`
**Location**: `server/api/applications/index.post.ts:71`
**Purpose**: Check if a worker can apply to a job (job is open, worker hasn't applied, has worker role)
**Parameters**:
- `job_uuid`: UUID
- `worker_uuid`: UUID

**Status**: ❌ NOT IMPLEMENTED
**Action Required**: Already has inline validation checks in the API route (lines 19-67), RPC call is redundant

---

### 6. `delete_user`
**Location**: `server/api/auth/delete-account.delete.ts:39`
**Purpose**: Delete a user and all their related data
**Parameters**: None (uses `auth.uid()`)

**Status**: ❌ NOT IMPLEMENTED
**Action Required**: Create SQL function with SECURITY DEFINER

---

### 7. `get_worker_applications` (FIXED)
**Location**: Previously in `server/api/applications/index.get.ts:41`
**Purpose**: Get all applications submitted by a worker
**Parameters**:
- `worker_uuid`: UUID

**Status**: ✅ REPLACED with direct query
**Fix Applied**: Lines 40-56 now use direct Supabase query

---

## Recommendations

### Immediate Actions (Critical)

1. **Replace `get_job_applications`** with direct query
   - Similar pattern to `get_worker_applications` fix
   - File: `server/api/applications/job/[id].get.ts`

2. **Replace `get_job_application_stats`** with direct aggregation
   - Use Supabase count queries
   - File: `server/api/applications/job/[id]/stats.get.ts`

3. **Remove redundant `can_apply_to_job`** RPC call
   - Validation already exists inline (lines 19-67)
   - File: `server/api/applications/index.post.ts`

### Medium Priority

4. **Implement `can_send_message`** validation
   - Replace with direct query checking application status
   - File: `server/api/messages/index.post.ts`

5. **Implement `delete_user`** function
   - Create SQL migration with SECURITY DEFINER
   - Handles cascading deletes safely

### Low Priority

6. **Implement `find_jobs_near`** (if geolocation feature is needed)
   - Requires PostGIS extension
   - Or use external geocoding service

---

## Migration Strategy

### Option 1: Create All RPC Functions (Recommended for Production)
- Create SQL migration files for each function
- Better performance for complex queries
- Centralized business logic
- Easier to test and maintain

### Option 2: Replace with Direct Queries (Faster Implementation)
- Replace RPC calls with Supabase client queries
- Simpler to understand and debug
- No database migrations needed
- May be less performant for complex operations

### Hybrid Approach (Current Status)
- Simple queries: Use direct Supabase queries
- Complex logic: Create RPC functions
- Security-critical: Use RPC with SECURITY DEFINER

---

## Next Steps

1. ✅ Fix application count schema validation (COMPLETED)
2. ✅ Fix worker applications query (COMPLETED)
3. ✅ Replace `get_job_applications` with direct query (COMPLETED)
4. ✅ Replace `get_job_application_stats` with aggregation (COMPLETED)
5. ✅ Remove redundant `can_apply_to_job` RPC call (COMPLETED)
6. ✅ Replace `can_send_message` with direct query (COMPLETED)
7. ⏳ Implement `delete_user` SQL function (LOW PRIORITY)
8. ⏳ Implement `find_jobs_near` if geolocation needed (LOW PRIORITY)

---

**Last Updated**: 2026-03-23
**Status**: Nearly Complete - 6 of 7 RPC issues resolved
