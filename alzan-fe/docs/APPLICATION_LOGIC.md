# Alzan Health App - Page Documentation

This document provides a comprehensive technical and non-technical overview of every screen in the Alzan Health application.

## Table of Contents

1. [Introduction](#introduction)
2. [Navigation Structure](#navigation-structure)
3. [Modules](#modules)
   - [Auth Module](#auth-module)
   - [Home Module](#home-module)
   - [Health Module](#health-module)
   - [Nutrition Module](#nutrition-module)
   - [Training Module](#training-module)
   - [Stats Module](#stats-module)
   - [Settings Module](#settings-module)

---

## Introduction

Alzan Health is a comprehensive fitness and health tracking application built with React Native (Expo) and Supabase. It allows users to track their training (gym and endurance), nutrition (meal logging, diet templates), and health metrics (weight, measurements, sleep).

---

## Navigation Structure

The app uses `react-navigation` with a Root Stack Navigator that handles the authentication flow. Once authenticated, users are presented with a Bottom Tab Navigator.

- **Root Navigator**:
  - `Auth`: Login/Register screen.
  - `Main`: The main Tab Navigator (authenticated).
  - `Onboarding`: Screens for initial user setup.

- **Tab Navigator**:
  - `Home`: Dashboard overview.
  - `Training`: Workout tracking and planning (Stack).
  - `Nutrition`: Diet and meal tracking (Stack).
  - `Health`: Body metrics and sleep tracking (Stack).
  - `Settings`: User preferences and app configuration (Stack).

---

## Auth Module

Handles user authentication and onboarding.

### AuthScreen

**Non-Technical Description**:
The entry point for the app. Allows users to sign in or create a new account.
**Technical Details**:

- **File**: `src/screens/auth/AuthScreen.tsx`
- **Data**: Uses `supabase.auth`.

### ForgotPasswordScreen

**Non-Technical Description**:
Allows users to request a password reset email if they cannot log in.
**Technical Details**:

- **File**: `src/screens/auth/ForgotPasswordScreen.tsx`
- **Route**: `ForgotPassword`
- **Data**: `supabase.auth.resetPasswordForEmail`

### OnboardingGoalsScreen & OnboardingProfileScreen

**Non-Technical Description**:
Collects initial user data (goals, height, weight) to set up their profile.
**Technical Details**:

- **Files**: `src/screens/auth/OnboardingGoalsScreen.tsx`, `OnboardingProfileScreen.tsx`
- **Data**: Updates `profiles` and `user_preferences`.

---

## Home Module

### HomeScreen

**Non-Technical Description**:
The main dashboard providing a summary of the day: upcoming workouts, nutrition progress, and key health stats.
**Technical Details**:

- **File**: `src/screens/home/HomeScreen.tsx`
- **Route**: `Home` (Tab)
- **Data**: Aggregates `daily_logs`, `workouts`, `nutrition_logs`, and **`sleep_logs`**.
- **Change Log**: Replaced Steps card with Sleep summary card (latest duration).

---

## Health Module

Focuses on tracking body metrics and sleep.

### HealthHome

**Non-Technical Description**:
The main health dashboard showing current weight trends, quick actions, and recent history.
**Technical Details**:

- **File**: `src/modules/health/screens/HealthHome.tsx`
- **Route**: `HealthHome`
- **Key Components**: `GlassCard`, `HealthCard`, `useHealthInsights`.

### BodyCompositionDetail

**Non-Technical Description**:
Detailed analysis of BMI, Body Fat %, and Muscle Mass, showing specific ranges (e.g., "Normal", "Overweight") based on user demographics.
**Technical Details**:

- **File**: `src/modules/health/screens/BodyCompositionDetail.tsx`
- **Route**: `BodyCompositionDetail`
- **Key Components**: `RangeBar`, `InfoModal`, `useHealthInsights`.
- **Logic**: Implements algorithms like Deurenberg and Navy Method.

### WeightList & WeightAdd

**Non-Technical Description**:
Log and view weight history.
**Technical Details**:

- **Files**: `src/modules/health/screens/WeightList.tsx`, `WeightAdd.tsx`
- **Data**: `weight_logs` table.

### MeasurementsList & MeasurementAdd

**Non-Technical Description**:
Log and view body measurements (abdomen, hips, chest, etc.).
**Technical Details**:

- **Files**: `src/modules/health/screens/MeasurementsList.tsx`, `MeasurementAdd.tsx`

### HealthStatisticsScreen

**Non-Technical Description**:
Detailed charts and trends for specific health metrics (e.g., Weight over last year).
**Technical Details**:

- **File**: `src/modules/health/screens/HealthStatisticsScreen.tsx`
- **Route**: `HealthStatistics`
- **Components**: `UseHealthData`, Charts (Recharts/Victory/Skia).

---

## Nutrition Module

Tools for tracking diet and meal planning.

### NutritionHomeScreen

**Non-Technical Description**:
Daily nutrition overview showing calories and macros vs targets. Displays a timeline of meals for the day.
**Technical Details**:

- **File**: `src/screens/nutrition/NutritionHomeScreen.tsx`
- **Route**: `NutritionHome`
- **Data**: `daily_nutrition_logs` and `diet_templates`.
- **Key Features**: Date selector, Progress bars for macros.

### DietTemplatesListScreen

**Non-Technical Description**:
A library of meal plans (e.g., "Maintenance", "Bulking").
**Technical Details**:

- **File**: `src/screens/nutrition/DietTemplatesListScreen.tsx`
- **Route**: `DietTemplatesList`

### DietTemplateEditorScreen

**Non-Technical Description**:
Create or edit a meal plan. Users can define meals for specific days of the week, setting calorie and macro targets for each meal.
**Technical Details**:

- **File**: `src/screens/nutrition/DietTemplateEditorScreen.tsx`
- **Route**: `DietTemplateEditor`
- **Data**: `diet_templates` and `diet_template_meals`.
- **Key Features**: Auto-estimate macros using `getMealNutrition`.

### MealLogFormScreen

**Non-Technical Description**:
The central screen for logging food. Users can search the database, scan barcodes, or use **AI Recipe Search** to find meals by name (e.g., "Paella valenciana") and automatically import ingredients.
**Technical Details**:

- **File**: `src/screens/nutrition/MealLogFormScreen.tsx`
- **Route**: `MealLogForm`
- **Key Services**: `recipeService` (AI Search), `nutritionApi`, `FoodScanner`.
- **Features**: AI-powered ingredient breakdown, manual override, barcode scanning.

### NutritionSettingsScreen

**Non-Technical Description**:
Configure nutrition preferences and export weekly summaries to PDF.
**Technical Details**:

- **Route**: `NutritionSettings` (Global Settings Stack)
- **Features**: PDF Export using `pdfExportService`.
- **Note**: Accessed via General Settings.

### FoodSearchScreen

**Non-Technical Description**:
Search for individual food items (e.g., "Banana", "Oats") to add to a meal log.
**Technical Details**:

- **File**: `src/screens/nutrition/FoodSearchScreen.tsx`
- **Route**: `FoodSearch`
- **Services**: `nutritionApi` (searchFoods).

### ScanBarcodeScreen

**Non-Technical Description**:
Scan food barcodes to quickly find and log items.
**Technical Details**:

- **File**: `src/screens/nutrition/ScanBarcodeScreen.tsx`
- **Route**: `ScanBarcode`
- **Note**: Currently uses a simulated camera/scan process for development.

---

## Training Module

Comprehensive workout tracking for Gym and Endurance.

### TrainingHomeScreen

**Non-Technical Description**:
The central hub for training. It features a **Weekly Strip Calendar** at the top to navigate between days. It summarizes the daily plan, showing both explicitly planned workouts and completed sessions. Users can swipe to delete plans or tap to start/resume them.
**Technical Details**:

- **File**: `src/screens/training/TrainingHomeScreen.tsx`
- **Route**: `TrainingHome`
- **Data**: Aggregates `workout_plans`, `activity_sessions` (completed), and scheduled templates. Uses `useQuery` with `keepPreviousData` for smooth date switching.
- **Key Features**:
  - **Smart Deletion**: Swipe-to-delete with recurring plan logic protection.
  - **Resume Workout**: Detects active sessions and offers a "Resume" button.
  - **Tools Grid**: Quick access to Templates, History, and Manual Logging.

### EnduranceSessionFormScreen

**Non-Technical Description**:
A unified form for logging or editing endurance activities (Run, Bike, Swim) and Gym sessions. It supports manual entry of distance, duration, and calories, or calculates them based on user weight and RPE.
**Technical Details**:

- **File**: `src/screens/training/EnduranceSessionFormScreen.tsx`
- **Route**: `EnduranceSessionForm`
- **Logic**:
  - **Calorie Estimation**: Uses `estimateCalories` util if no device data is present.
  - **Sport Modes**: Dynamic fields based on `SPORTS_CONFIG` (e.g., elevation only for outdoor sports).
  - **Gym Integration**: Can accept a `gymSessionData` param to pre-fill data from a finished gym workout.

### GymRoutinesListScreen

**Non-Technical Description**:
Manages gym workout templates. Users can create, edit, delete, or assign routines to a specific date.
**Technical Details**:

- **File**: `src/screens/training/GymRoutinesListScreen.tsx`
- **Route**: `GymRoutinesList`
- **Logic**: Enforces a 20-routine limit. Supports "Assign to Date" mode via navigation params.

### Endurance Module

**Screens**:

- **EnduranceSessionsList**: `src/screens/training/EnduranceSessionsListScreen.tsx` - History of runs/rides/swims.
- **EnduranceSessionDetail**: `src/screens/training/EnduranceSessionDetailScreen.tsx` - Detailed view of a completed session (GPS map, splits).
- **EnduranceWorkoutBuilder**: `src/screens/training/EnduranceWorkoutBuilderScreen.tsx` - Create interval workouts.
- **EnduranceSessionForm**: `src/screens/training/EnduranceSessionFormScreen.tsx` - Manual entry or post-session edit.

### Other Training Info

**Screens**:

- **ExerciseSearch**: `src/screens/training/ExerciseSearchScreen.tsx` - Database of exercises.
- **ExerciseDetail**: `src/screens/training/ExerciseDetailScreen.tsx` - Instructions/history for an exercise.
- **WeeklyPlan**: `src/screens/training/WeeklyPlanScreen.tsx` - Calendar view of planned/completed workouts.
- **SportTemplatesList**: `src/screens/training/SportTemplatesListScreen.tsx`.
- **ExternalActivityLinking**: `src/screens/training/ExternalActivityLinkingScreen.tsx`.

### TrainingSettingsScreen

**Non-Technical Description**:
Configure training preferences and export training history to PDF.
**Technical Details**:

- **File**: `src/screens/training/TrainingSettingsScreen.tsx`
- **Route**: `TrainingSettings` (Global Settings Stack)
- **Features**: PDF Export using `trainingPdfExportService`.
- **Note**: Accessed via General Settings.

---

---

## Stats Module

Analytics hub for reviewing progress across all domains.

### StatsHomeScreen

**Non-Technical Description**:
A centralized dashboard for analyzing long-term progress. Users can switch between "Overview", "Training", "Nutrition", and "Health" views to see charts and trends over specific time ranges (e.g., last 4 weeks, 3 months).
**Technical Details**:

- **File**: `src/screens/stats/StatsHomeScreen.tsx`
- **Route**: `StatsGlobal` (Settings Stack)
- **Key Components**: `DateRangeSelector`, views (`OverviewView`, `TrainingView`, `NutritionView`, `HealthView`).
- **Data**: Aggregates data from various tables (`daily_logs`, `activity_sessions`, `weight_logs`) depending on the active view and selected date range.

---

## Settings Module

User configuration.

### SettingsHomeScreen

**Non-Technical Description**:
Main menu for Profile, Account, and App Preferences.
**Technical Details**:

- **File**: `src/screens/settings/SettingsHomeScreen.tsx`
- **Route**: `SettingsHome`

### ProfileScreen

**Non-Technical Description**:
Update personal details (Height, Weight, Age).
**Technical Details**:

- **File**: `src/screens/settings/ProfileScreen.tsx`

### GoalsScreen

**Non-Technical Description**:
Set metabolic and fitness goals.
**Technical Details**:

- **File**: `src/screens/settings/GoalsScreen.tsx`

### Other Settings Screens

**Technical Details**:

- **Preferences**: `src/screens/settings/PreferencesScreen.tsx` - App-wide settings (units, theme).
- **Connected Apps**: `src/screens/settings/ConnectedAppsScreen.tsx` - External integrations.
- **Privacy**: `src/screens/settings/PrivacyScreen.tsx` - Privacy policy and settings.
- **Account**: `src/screens/settings/AccountScreen.tsx` - Account management.
- **Security**: `src/screens/settings/SecurityScreen.tsx`.
- **Data Export**: `src/screens/settings/DataExportScreen.tsx`.
