-- Check if practitioner has any memos
-- Replace 'PRACTITIONER_USER_ID' with the actual practitioner's user ID

SELECT 
  uvsm.user_id,
  p.full_name,
  uvsm.virtue_id,
  v.name as virtue_name,
  uvsm.stage_number,
  LENGTH(uvsm.memo_text) as memo_length,
  uvsm.created_at,
  uvsm.updated_at
FROM user_virtue_stage_memos uvsm
JOIN profiles p ON p.id = uvsm.user_id
JOIN virtues v ON v.id = uvsm.virtue_id
WHERE uvsm.user_id = 'PRACTITIONER_USER_ID'
ORDER BY uvsm.virtue_id, uvsm.stage_number;

-- Also check progress to see what stages are marked as in_progress
SELECT 
  uvsp.user_id,
  p.full_name,
  uvsp.virtue_id,
  v.name as virtue_name,
  uvsp.stage_number,
  uvsp.status,
  uvsp.updated_at
FROM user_virtue_stage_progress uvsp
JOIN profiles p ON p.id = uvsp.user_id
JOIN virtues v ON v.id = uvsp.virtue_id
WHERE uvsp.user_id = 'PRACTITIONER_USER_ID'
ORDER BY uvsp.virtue_id, uvsp.stage_number;
