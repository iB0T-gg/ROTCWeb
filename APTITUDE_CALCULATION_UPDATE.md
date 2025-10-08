# Aptitude Calculation Update for 15-Week System

## Summary
Updated the aptitude calculation formula to properly work with the new 15-week system (150 maximum points).

## Key Changes Made

### 1. Updated Aptitude Calculation Formula
**Previous (incorrect for 15 weeks):**
```javascript
// This was capping at 150 * 0.30 = 45, which exceeds the 30-point maximum
if (total >= 150) {
  return 30;
}
return Math.round(total * 0.30);
```

**New (correct for 15 weeks):**
```javascript
// Properly scales total merits (0-150) to aptitude score (0-30)
const aptitudeScore = Math.round((total / 150) * 30);
return Math.min(30, Math.max(0, aptitudeScore));
```

### 2. Calculation Examples
With the new 15-week system (150 max points):

| Scenario | Total Merits | Calculation | Aptitude Score |
|----------|--------------|-------------|----------------|
| Perfect (all 10s) | 150/150 | (150/150) × 30 = 30 | 30/30 (100%) |
| Good (all 9s) | 135/150 | (135/150) × 30 = 27 | 27/30 (90%) |
| Average (all 8s) | 120/150 | (120/150) × 30 = 24 | 24/30 (80%) |
| Below Average (all 7s) | 105/150 | (105/150) × 30 = 21 | 21/30 (70%) |
| Poor (all 5s) | 75/150 | (75/150) × 30 = 15 | 15/30 (50%) |
| Worst (all 0s) | 0/150 | (0/150) × 30 = 0 | 0/30 (0%) |

### 3. Technical Details
- **Maximum Possible Points**: 150 (15 weeks × 10 points per week)
- **Aptitude Range**: 0-30 points
- **Formula**: `Math.round((totalMerits / 150) × 30)`
- **Scaling**: Linear scaling from merit score to aptitude percentage

### 4. Database Consistency
- All existing records have been migrated to 15 weeks
- Aptitude scores have been recalculated based on 150 max points
- Test case created with mixed merit/demerit values to verify calculations

### 5. Frontend Updates
- `calculateAptitudeScore()` function updated
- Calculation now properly scales to 30-point maximum
- Both semester tabs use identical 15-week calculation

## Verification
✅ Database migration completed successfully
✅ Calculation formula updated and tested
✅ Test cases verify correct scaling
✅ No syntax errors in code
✅ Both semesters now use consistent 15-week structure

## Impact
- **Users**: Aptitude scores now accurately reflect performance across 15 weeks
- **Calculations**: Proper linear scaling from 0-150 merits to 0-30 aptitude
- **Consistency**: Both semesters use identical calculation methodology
- **Accuracy**: No more calculation inconsistencies or incorrect maximums