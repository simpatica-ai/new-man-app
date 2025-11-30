# Work Product Reporting Test Plan

## Prerequisites
- Database migration applied successfully
- User with some virtue progress data
- User with completed assessment (for combined reports)
- Sponsor/coach relationship set up (for supervisor testing)

## Test Cases

### 1. Basic Report Generation
**Steps:**
1. Navigate to `/reports/work-product`
2. Select a practitioner from dropdown
3. Leave default settings (last 90 days, all stages)
4. Click "Generate Preview"
5. Verify preview shows correct statistics
6. Click "Download PDF"

**Expected Results:**
- Preview loads with correct data
- PDF downloads successfully
- PDF contains practitioner info, timeline, virtue progress

### 2. Filtered Report Generation
**Steps:**
1. Navigate to `/reports/work-product`
2. Select a practitioner
3. Change date range to last 30 days
4. Change status filter to "Completed Only"
5. Select specific virtues from the list
6. Click "Generate Preview"

**Expected Results:**
- Preview shows only completed stages
- Only selected virtues appear
- Date range is respected
- Statistics reflect filters

### 3. Combined Report (Work Product + Assessment)
**Steps:**
1. Navigate to `/reports/work-product`
2. Select a practitioner who has completed an assessment
3. Check "Include Assessment Report" checkbox
4. Click "Generate Preview"
5. Verify preview shows assessment data section
6. Click "Download PDF"

**Expected Results:**
- Preview shows assessment data summary
- PDF contains both work product and assessment sections
- Assessment date and virtue count displayed

### 4. Report Button Navigation
**Steps:**
1. Navigate to `/virtue/1` (or any virtue page)
2. Click "Report" button in header
3. Verify it navigates to report page with pre-selected filters

**Expected Results:**
- Navigates to `/reports/work-product?practitioner_id=USER_ID&virtue_ids=1`
- Report generator loads with virtue pre-selected
- User is pre-selected

### 5. Sponsor Dashboard Integration
**Steps:**
1. Navigate to `/sponsor/dashboard` (as sponsor/coach)
2. Find a practitioner card
3. Click "Generate Report" button
4. Verify navigation and pre-selection

**Expected Results:**
- Navigates to report page
- Practitioner is pre-selected
- Can generate report for assigned practitioner

### 6. Error Handling
**Steps:**
1. Try to generate report for user with no data
2. Try to access report page without proper permissions
3. Try to generate report with invalid date range

**Expected Results:**
- Graceful error messages
- No crashes or blank screens
- Clear feedback to user

### 7. Performance Testing
**Steps:**
1. Generate report for user with lots of data (100+ journal entries, multiple virtues)
2. Test with large date ranges (1 year+)
3. Test concurrent report generation

**Expected Results:**
- Reports generate within reasonable time (< 10 seconds)
- No timeouts or memory issues
- PDF generation completes successfully

## Database Function Testing

### Test the new database functions directly:

```sql
-- Test work product summary
SELECT * FROM get_work_product_summary(
  'USER_ID_HERE'::UUID,
  '2024-01-01'::TIMESTAMP WITH TIME ZONE,
  '2025-01-12'::TIMESTAMP WITH TIME ZONE,
  'both'
);

-- Test virtue stage work details
SELECT * FROM get_virtue_stage_work_details(
  'USER_ID_HERE'::UUID,
  '2024-01-01'::TIMESTAMP WITH TIME ZONE,
  '2025-01-12'::TIMESTAMP WITH TIME ZONE,
  'completed',
  ARRAY[1,2,3]::INTEGER[]
);

-- Test available virtues
SELECT * FROM get_available_virtues_for_user('USER_ID_HERE'::UUID);
```

## Security Testing

### Test Row Level Security:
1. Try to access another user's report data
2. Test organizational boundaries
3. Verify supervisor can only see assigned practitioners
4. Test admin access to organization reports

## Browser Compatibility
- Test in Chrome, Firefox, Safari
- Test PDF download in different browsers
- Test responsive design on mobile

## Data Validation
- Verify report data matches database
- Check date filtering accuracy
- Validate virtue filtering
- Confirm assessment data integration

## Troubleshooting Common Issues

### If reports don't generate:
1. Check browser console for errors
2. Verify database migration was applied
3. Check user has required permissions
4. Verify practitioner has some progress data

### If PDF download fails:
1. Check browser popup blockers
2. Verify file-saver library is installed
3. Check for JavaScript errors in console

### If navigation doesn't work:
1. Verify routes are properly configured
2. Check for authentication issues
3. Verify user roles and permissions