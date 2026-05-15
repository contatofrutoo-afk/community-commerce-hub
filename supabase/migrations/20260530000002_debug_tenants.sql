-- Check for duplicate slugs in tenants table
SELECT slug, COUNT(*) as count 
FROM tenants 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Check all tenants with their slugs
SELECT id, name, slug FROM tenants ORDER BY slug;

-- Check if there are memberships for this user in the right tenant
-- (Replace USER_ID with actual user id from console)