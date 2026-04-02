import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RouteProp, useRoute } from '@react-navigation/native';

import { OnboardingLanguage } from '../screens/onboarding/OnboardingLanguage';
import { OnboardingIdentity } from '../screens/onboarding/OnboardingIdentity';
import { OnboardingMetrics } from '../screens/onboarding/OnboardingMetrics';
import { OnboardingGoal } from '../screens/onboarding/OnboardingGoal';
import { OnboardingPhysical } from '../screens/onboarding/OnboardingPhysical';
import { OnboardingActivity } from '../screens/onboarding/OnboardingActivity';
import { OnboardingProfile } from '../screens/onboarding/OnboardingProfile';
import { OnboardingUnits } from '../screens/onboarding/OnboardingUnits';
import { OnboardingHealth } from '../screens/onboarding/OnboardingHealth';
import { OnboardingConsent } from '../screens/onboarding/OnboardingConsent';
import { OnboardingComplete } from '../screens/onboarding/OnboardingComplete';

export type OnboardingStackParamList = {
  OnboardingLanguage: undefined;
  OnboardingIdentity: undefined;
  OnboardingMetrics: undefined;
  OnboardingGoal: undefined;
  OnboardingPhysical: undefined;
  OnboardingActivity: undefined;
  OnboardingProfile: undefined;
  OnboardingUnits: undefined;
  OnboardingHealth: undefined;
  OnboardingConsent: undefined;
  OnboardingComplete: undefined;
};

type OnboardingNavigatorParams = {
  Onboarding: { initialRoute?: string };
};

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = () => {
  const route = useRoute<RouteProp<OnboardingNavigatorParams, 'Onboarding'>>();
  const initialRoute = (route.params?.initialRoute || 'OnboardingLanguage') as keyof OnboardingStackParamList;
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swiping back during onboarding
        cardStyle: { flex: 1 },
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen name="OnboardingLanguage" component={OnboardingLanguage} />
      <Stack.Screen name="OnboardingIdentity" component={OnboardingIdentity} />
      <Stack.Screen name="OnboardingMetrics" component={OnboardingMetrics} />
      <Stack.Screen name="OnboardingGoal" component={OnboardingGoal} />
      <Stack.Screen name="OnboardingPhysical" component={OnboardingPhysical} />
      <Stack.Screen name="OnboardingActivity" component={OnboardingActivity} />
      <Stack.Screen name="OnboardingProfile" component={OnboardingProfile} />
      <Stack.Screen name="OnboardingUnits" component={OnboardingUnits} />
      <Stack.Screen name="OnboardingHealth" component={OnboardingHealth} />
      <Stack.Screen name="OnboardingConsent" component={OnboardingConsent} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingComplete} />
    </Stack.Navigator>
  );
};
