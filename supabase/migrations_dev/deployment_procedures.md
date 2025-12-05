# Deployment Procedures: Organizational Model Migration

## Pre-Deployment Checklist

### 1. Environment Preparation
- [ ] Staging environment updated and tested
- [ ] Production backup completed and verified
- [ ] Migration scripts tested on staging with production data copy
- [ ] Rollback procedures tested and validated
- [ ] Team notifications sent (24 hours prior)
- [ ] Maintenance window scheduled and communicated

### 2. Technical Prerequisites
- [ ] Database connection limits increased temporarily
- [ ] Application deployment pipeline ready
- [ ] Feature flags configured for gradual rollout
- [ ] Monitoring dashboards prepared
- [ ] Support team briefed on potential issues

### 3. Validation Preparation
- [ ] Validation scripts tested on staging
- [ ] Performance benchmarks established
- [ ] User acceptance criteria defined
- [ ] Success metrics identified

## Deployment Steps

### Phase 1: Database Migration (30 minutes)

#### Step 1: Enable Maintenance Mode
```bash
# Set maintenance mode
kubectl patch configmap app-config --patch '{"data":{"MAINTENANCE_MODE":"true"}}'

# Scale down application to prevent new connections
kubectl scale deployment virtue-app --replicas=0

# Wait for connections to drain
sleep 30
```

#### Step 2: Execute Migration Scripts
```bash
# Navigate to migration directory
cd supabase/migrations

# Execute schema migration
psql $DATABASE_URL -f 20250103_organizational_model_schema.sql

# Execute data migration
psql $DATABASE_URL -f 20250103_organizational_model_data.sql

# Execute index creation
psql $DATABASE_URL -f 20250103_organizational_model_indexes.sql
```

#### Step 3: Validate Migration
```bash
# Run validation script
psql $DATABASE_URL -f validate_production_migration.sql

# Check for critical errors
if [ $? -ne 0 ]; then
  echo "Migration validation failed - initiating rollback"
  psql $DATABASE_URL -f rollback_organizational_model.sql
  exit 1
fi
```

### Phase 2: Application Deployment (15 minutes)

#### Step 4: Deploy Application
```bash
# Deploy new application version with organizational features
kubectl set image deployment/virtue-app app=virtue-app:organizational-model-v1.0

# Wait for deployment to complete
kubectl rollout status deployment/virtue-app --timeout=300s

# Scale up application
kubectl scale deployment virtue-app --replicas=3
```

#### Step 5: Enable Features Gradually
```bash
# Enable organizational features for admin users first
kubectl patch configmap feature-flags --patch '{"data":{"ORGANIZATIONAL_ADMIN":"true"}}'

# Wait 5 minutes and monitor
sleep 300

# Enable for coaches (former sponsors)
kubectl patch configmap feature-flags --patch '{"data":{"ORGANIZATIONAL_COACH":"true"}}'

# Wait 5 minutes and monitor
sleep 300

# Enable for all users
kubectl patch configmap feature-flags --patch '{"data":{"ORGANIZATIONAL_MODEL":"true"}}'
```

#### Step 6: Disable Maintenance Mode
```bash
# Disable maintenance mode
kubectl patch configmap app-config --patch '{"data":{"MAINTENANCE_MODE":"false"}}'
```

### Phase 3: Post-Deployment Validation (1 hour)

#### Step 7: Functional Testing
```bash
# Test user authentication
curl -X POST $APP_URL/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Test coach dashboard (former sponsor)
curl -X GET $APP_URL/api/coach/dashboard \
  -H "Authorization: Bearer $TEST_TOKEN"

# Test practitioner access
curl -X GET $APP_URL/api/practitioner/dashboard \
  -H "Authorization: Bearer $PRACTITIONER_TOKEN"
```

#### Step 8: Performance Monitoring
```bash
# Monitor database performance
psql $DATABASE_URL -c "
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements 
WHERE query LIKE '%organization%'
ORDER BY total_time DESC 
LIMIT 10;"

# Monitor application metrics
kubectl top pods -l app=virtue-app

# Check error rates
kubectl logs -l app=virtue-app --tail=100 | grep -i error
```

## Monitoring Checkpoints

### Immediate Monitoring (First 30 minutes)
- [ ] User login success rate > 95%
- [ ] API response times < 2 seconds
- [ ] Database CPU usage < 80%
- [ ] Application error rate < 1%
- [ ] No critical errors in logs

### Extended Monitoring (First 4 hours)
- [ ] All existing sponsor dashboards accessible as coach dashboards
- [ ] Practitioner experience unchanged
- [ ] No user-reported data inconsistencies
- [ ] Organization features working for test accounts
- [ ] Performance metrics within acceptable ranges

### 24-Hour Monitoring
- [ ] User engagement levels maintained
- [ ] No increase in support tickets
- [ ] Database performance stable
- [ ] All organizational features functional
- [ ] Migration success metrics achieved

## Rollback Triggers

### Immediate Rollback Required
- User login failure rate > 10%
- Database connection failures
- Critical data corruption detected
- Application completely inaccessible
- Security vulnerabilities exposed

### Rollback Consideration
- User login failure rate 5-10%
- API response times > 5 seconds
- Database CPU usage > 90%
- Application error rate > 5%
- Significant user complaints

## Rollback Procedures

### Emergency Rollback (< 1 hour after deployment)
```bash
# Immediate application rollback
kubectl rollout undo deployment/virtue-app

# Database rollback
psql $DATABASE_URL -f rollback_organizational_model.sql

# Disable organizational features
kubectl patch configmap feature-flags --patch '{"data":{"ORGANIZATIONAL_MODEL":"false"}}'

# Verify rollback
psql $DATABASE_URL -f validate_production_migration.sql
```

### Planned Rollback (> 1 hour after deployment)
```bash
# Enable maintenance mode
kubectl patch configmap app-config --patch '{"data":{"MAINTENANCE_MODE":"true"}}'

# Scale down application
kubectl scale deployment virtue-app --replicas=0

# Execute rollback script
psql $DATABASE_URL -f rollback_organizational_model.sql

# Deploy previous application version
kubectl set image deployment/virtue-app app=virtue-app:previous-stable

# Scale up and disable maintenance mode
kubectl scale deployment virtue-app --replicas=3
kubectl patch configmap app-config --patch '{"data":{"MAINTENANCE_MODE":"false"}}'
```

## Communication Templates

### Pre-Migration Notification (24 hours)
```
Subject: Scheduled Maintenance - Virtue Development Platform

Dear Users,

We will be performing scheduled maintenance on [DATE] from [START_TIME] to [END_TIME] [TIMEZONE].

During this time:
- The platform will be temporarily unavailable
- No data will be lost
- New organizational features will be available after maintenance

We apologize for any inconvenience.

Best regards,
The Virtue Development Team
```

### Migration Complete Notification
```
Subject: Maintenance Complete - New Organizational Features Available

Dear Users,

Our scheduled maintenance has been completed successfully. The platform is now fully operational with new organizational features.

What's New:
- Enhanced coach dashboard (formerly sponsor dashboard)
- Improved user management capabilities
- Better activity tracking and reporting

If you experience any issues, please contact support.

Best regards,
The Virtue Development Team
```

### Rollback Notification (if needed)
```
Subject: Service Restored - Temporary Issue Resolved

Dear Users,

We experienced a technical issue during our maintenance window and have restored the platform to its previous stable state.

Current Status:
- All services are operational
- Your data is safe and unchanged
- New features will be deployed at a later date

We apologize for the inconvenience and will provide updates on the new feature rollout.

Best regards,
The Virtue Development Team
```

## Success Criteria Verification

### Technical Success Metrics
```bash
# Verify user migration
psql $DATABASE_URL -c "
SELECT 
  'Total Users' as metric,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
  'Users with Organization',
  COUNT(*)
FROM profiles 
WHERE organization_id IS NOT NULL;"

# Verify relationship migration
psql $DATABASE_URL -c "
SELECT 
  'Coach Assignments' as metric,
  COUNT(*) as count
FROM practitioner_assignments 
WHERE supervisor_role = 'coach';"

# Verify performance
psql $DATABASE_URL -c "
SELECT 
  schemaname,
  tablename,
  n_tup_ins + n_tup_upd + n_tup_del as total_operations,
  seq_scan,
  idx_scan
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY total_operations DESC;"
```

### User Experience Validation
- [ ] Test user can log in successfully
- [ ] Former sponsor can access coach dashboard
- [ ] Practitioner experience unchanged
- [ ] All virtue progress data preserved
- [ ] No broken links or missing features

### Business Success Validation
- [ ] Migration completed within maintenance window
- [ ] No extended service disruption
- [ ] Support ticket volume normal
- [ ] User engagement metrics maintained
- [ ] Foundation ready for organizational features

## Post-Migration Tasks

### Immediate (Day 1)
- [ ] Monitor system stability
- [ ] Address any user-reported issues
- [ ] Verify all validation checks pass
- [ ] Document any issues encountered
- [ ] Update monitoring dashboards

### Short-term (Week 1)
- [ ] Collect user feedback on changes
- [ ] Analyze performance metrics
- [ ] Plan gradual organizational feature rollout
- [ ] Update documentation and training materials
- [ ] Prepare for Phase 2 features

### Long-term (Month 1)
- [ ] Evaluate migration success metrics
- [ ] Plan next organizational features
- [ ] Optimize performance based on usage patterns
- [ ] Conduct lessons learned session
- [ ] Update deployment procedures based on experience

## Emergency Contacts

### Technical Team
- Database Administrator: [CONTACT]
- DevOps Engineer: [CONTACT]
- Lead Developer: [CONTACT]
- System Administrator: [CONTACT]

### Business Team
- Product Manager: [CONTACT]
- Customer Support Lead: [CONTACT]
- Communications Manager: [CONTACT]

### Escalation
- Engineering Manager: [CONTACT]
- CTO: [CONTACT]
- CEO: [CONTACT]

## Documentation Updates Required

### Technical Documentation
- [ ] API documentation for organizational endpoints
- [ ] Database schema documentation
- [ ] Deployment runbook updates
- [ ] Monitoring playbook updates

### User Documentation
- [ ] Coach dashboard guide (updated from sponsor guide)
- [ ] Admin user management guide
- [ ] Organizational features overview
- [ ] FAQ updates for organizational model

### Training Materials
- [ ] Support team training on organizational features
- [ ] Customer onboarding materials
- [ ] Video tutorials for new features
- [ ] Migration communication templates