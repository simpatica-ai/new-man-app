-- Check existing organizations to use the existing test organization
SELECT 
    id,
    name,
    website_url,
    created_at
FROM organizations
ORDER BY created_at;