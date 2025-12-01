-- ============================================================================
-- Check if assessment data exists for Bob Wenzlau
-- ============================================================================

-- Check if user exists
SELECT 
  'User Check' as info,
  id,
  full_name,
  email
FROM public.profiles
WHERE id = '0dba2cfa-1a91-4c4e-a363-7dfb22ba67eb';

-- Check if user has any assessments
SELECT 
  'User Assessments' as info,
  id as assessment_id,
  user_id,
  created_at,
  completed_at
FROM public.user_assessments
WHERE user_id = '0dba2cfa-1a91-4c4e-a363-7dfb22ba67eb'
ORDER BY created_at DESC;

-- Check if user has assessment results
SELECT 
  'Assessment Results' as info,
  COUNT(*) as result_count,
  MAX(created_at) as latest_result
FROM public.user_assessment_results
WHERE user_id = '0dba2cfa-1a91-4c4e-a363-7dfb22ba67eb';

-- Show actual results if they exist
SELECT 
  'Detailed Results' as info,
  assessment_id,
  virtue_name,
  priority_score,
  defect_intensity,
  created_at
FROM public.user_assessment_results
WHERE user_id = '0dba2cfa-1a91-4c4e-a363-7dfb22ba67eb'
ORDER BY priority_score DESC
LIMIT 20;
