# Onboarding Module - Technical Documentation

## Overview

The Onboarding module provides a step-by-step registration flow for new users. It collects essential profile information, preferences, and consent before allowing access to the main app.

**Location**: `src/screens/onboarding/`

## Architecture

```
src/
├── types/
│   └── onboarding.types.ts      # Types, enums, and constants
├── hooks/
│   ├── useOnboarding.ts         # State management and persistence
│   └── useOnboardingStyles.ts   # Theme-aware styles
├── components/
│   └── OnboardingProgress.tsx   # Step indicator component
├── screens/onboarding/
│   ├── index.ts                 # Barrel exports
│   ├── OnboardingIdentity.tsx   # Step 1: Name + Username
│   ├── OnboardingGoal.tsx       # Step 2: Primary objective
│   ├── OnboardingPhysical.tsx   # Step 3: Height + Weight
│   ├── OnboardingProfile.tsx    # Step 4: Birth date + Sex
│   ├── OnboardingUnits.tsx      # Step 5: Unit preferences
│   ├── OnboardingHealth.tsx     # Step 6: Health connect (Coming Soon)
│   ├── OnboardingConsent.tsx    # Step 7: Terms & Privacy
│   └── OnboardingComplete.tsx   # Step 8: Success
└── navigation/
    ├── OnboardingNavigator.tsx  # Stack navigator for onboarding
    └── RootNavigator.tsx        # Updated to include onboarding flow
```

## Database Schema

The onboarding flow uses the existing `users` table with these fields:

```sql
ALTER TABLE public.users ADD COLUMN onboarding_step integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN username text UNIQUE;
```

- `onboarding_step`: Current step (0 = not started, 1-8 = in progress, 9+ = complete)
- `username`: Unique public identifier (immutable after creation)

## Flow Logic

### Step Determination

1. User logs in or registers
2. `RootNavigator` checks `onboarding_step` from database
3. If step ≤ 8: Navigate to `OnboardingNavigator` at the saved step
4. If step > 8: Navigate to main app

### Data Persistence

Each step saves data immediately when "Continuar" is pressed:

| Step | Data Saved                        | Table              |
| ---- | --------------------------------- | ------------------ |
| 1    | display_name, username            | users              |
| 2    | primary goal                      | user_goals         |
| 3    | height_cm, weight_kg              | users, weight_logs |
| 4    | date_of_birth, sex                | users              |
| 5    | weight/distance/pace/energy units | user_preferences   |
| 6    | (Coming Soon)                     | -                  |
| 7    | health_data_consent               | user_preferences   |

## Step Categories

### Mandatory (Cannot Skip)

- Step 1: Identity (name + username)
- Step 2: Goal
- Step 3: Physical data
- Step 4: Profile (birth date + sex)
- Step 7: Terms & Consent

### Optional (Can Skip)

- Step 5: Units (defaults to kg/km/min-km/kcal)
- Step 6: Health Connect (Coming Soon)

## Key Components

### `useOnboarding` Hook

```typescript
const {
  currentStep, // Current OnboardingStep enum value
  data, // Collected OnboardingData
  loading, // Initial loading state
  saving, // Save operation in progress
  isComplete, // Whether onboarding is finished
  updateData, // Update local state
  saveAndNext, // Save current step and advance
  skip, // Skip optional step
  checkUsernameAvailable, // Debounced username check
  canSkipCurrentStep, // Whether current step is skippable
} = useOnboarding();
```

### Username Validation

Real-time validation with debounced database check:

- Minimum 3 characters
- Alphanumeric + underscores only
- Unique across all users
- Case-insensitive (stored lowercase)

## What's Left to Implement

### 1. Health Connect Integration (Step 6)

Currently shows "Coming Soon" badge. To fully implement:

- **iOS**: Integrate Apple HealthKit
  - Request authorization for activity, weight, heart rate
  - Import historical data
  - Set up background sync

- **Android**: Integrate Google Health Connect
  - Similar authorization and data flow

### 2. Legal Documents

Placeholder URLs in `OnboardingConsent.tsx`:

```typescript
const TERMS_URL = 'https://alzan.health/terms';
const PRIVACY_URL = 'https://alzan.health/privacy';
```

Replace with actual hosted documents.

### 3. Localization

All strings are currently hardcoded in Spanish. To localize:

- Add keys to `src/i18n/locales/es.ts` and `en.ts`
- Replace hardcoded strings with `t('key')` calls

### 4. Analytics Events

Consider tracking:

- Onboarding started
- Each step completed
- Drop-off points
- Time spent per step

### 5. Unit Conversion

Currently step 3 always uses cm/kg. To support lb/other units:

- Update input to show unit toggle
- Convert values before saving

## Testing Checklist

- [ ] Fresh registration shows onboarding
- [ ] Each mandatory step blocks progression if empty
- [ ] Skip button works on optional steps
- [ ] Username validation shows ✓/✕ correctly
- [ ] App restart returns to correct step
- [ ] Completing step 8 redirects to main app
- [ ] Dark mode displays correctly
- [ ] Keyboard doesn't cover inputs
- [ ] Date picker works on iOS and Android
