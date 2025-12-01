-- ============================================================================
-- Check if Bob's assessment data exists in production
-- ============================================================================

-- 1. Check if Bob's profile exists
SELECT 
  'Bob Profile' as check_type,
  id,
  full_name,
  has_completed_first_assessment
FROM public.profiles
WHERE id = '0dba2cfa-1a91-4c4e-a363-7dfb22ba67eb';

-- 2. Check user_assessments table for Bob
SELECT 
  'user_assessments' as check_type,
  id as assessment_id,
  user_id,
  assessment_type,
  created_at,
  completed_at
FROM public.user_assessments
WHERE user_id = '0dba2cfa-1a91-4c4e-a363-7dfb22ba67eb'
ORDER BY created_at DESC;

-- 3. Check user_assessment_results table for Bob
SELECT 
  'user_assessment_results' as check_type,
  id,
  assessment_id,
  user_id,
  virtue_name,
  priority_score,
  defect_intensity,
  created_at
FROM public.user_assessment_results
WHERE user_id = '0dba2cfa-1a91-4c4e-a363-7dfb22ba67eb'
ORDER BY priority_score DESC
LIMIT 20;

-- 4. Count total records
SELECT 
  'Summary' as check_type,
  (SELECT COUNT(*) FROM public.user_assessments WHERE user_id = '0dba2cfa-1a91-4c4e-a363-7dfb22ba67eb') as assessments_count,
  (SELECT COUNT(*) FROM public.user_assessment_results WHERE user_id = '0dba2cfa-1a91-4c4e-a363-7dfb22ba67eb') as results_count;
