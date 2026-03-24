# Supabase Auth Configuration Fix: `auth_db_connections_absolute`

## Problem Description
You are receiving the `auth_db_connections_absolute` warning because your Supabase Auth service (GoTrue) is configured to use a fixed, absolute number of database connections (e.g., 10 connections). 

**Recommendation:** Switch to a percentage-based allocation (15-20%) of the total available database connections. This allows the Auth service to scale its connection pool automatically if you upgrade your database compute instance.

## Solution

This configuration applies to the **Auth Service** infrastructure, which runs separately from your PostgreSQL database. Therefore, **it cannot be changed via standard SQL commands** (like `ALTER SYSTEM` or `ALTER ROLE`) from within the database itself.

You must apply this fix via the Supabase Dashboard or infrastructure configuration.

### Option 1: One-Click Fix via Dashboard (Recommended)
This is the safest and fastest method for managed Supabase projects.

1. Log in to your **Supabase Dashboard**.
2. Select your project.
3. In the left sidebar, click on the **Database** icon.
4. Navigate to the **Advisors** tab (sometimes labeled "Security Advisor" or "Performance Advisor").
5. Look for the warning: **"Auth server configuration: auth_db_connections_absolute"**.
6. Click the **Apply Fix** (or "Resolve") button next to the warning.
   - *This action automatically updates the Auth service configuration to use a percentage-based pool (typically 20%).*

### Option 2: Infrastructure Configuration (Self-Hosted / Custom)
If you are running self-hosted Supabase or have direct access to service environment variables:

1. Locate your Auth service configuration (often in `.env` or `config.toml`).
2. Find the variable controlling the DB pool size, typically `GOTRUE_DB_MAX_POOL_SIZE` (or similar depending on version).
3. Change the value from a raw integer (e.g., `10`) to a percentage string (e.g., `20%`).
4. **Restart** the Auth service container/process to apply changes.

## Verification
After applying the fix:
1. Wait a few minutes for the Auth server to restart with the new configuration.
2. Return to the **Advisors** section in the Supabase Dashboard.
3. Refresh the page to confirm the warning has cleared.