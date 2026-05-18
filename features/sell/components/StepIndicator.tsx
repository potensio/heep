// features/sell/components/StepIndicator.tsx
import { View, Text } from 'react-native';
import type { WizardStep } from '../types';

interface StepIndicatorProps {
  currentStep: WizardStep;
  stepLabels: string[];
}

export function StepIndicator({ currentStep, stepLabels }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center px-4 py-3">
      {stepLabels.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const isLast = index === stepLabels.length - 1;

        return (
          <View key={stepNumber} className="flex-row items-center">
            <View className="items-center">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isActive
                    ? 'bg-[#9AE600]'
                    : isCompleted
                    ? 'bg-[#9AE600]'
                    : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isActive || isCompleted ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {stepNumber}
                </Text>
              </View>
              <Text
                className={`text-xs mt-1 ${
                  isActive ? 'text-[#7CCF00] font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </Text>
            </View>

            {!isLast && (
              <View
                className={`w-12 h-0.5 mx-2 ${
                  isCompleted ? 'bg-[#9AE600]' : 'bg-gray-200'
                }`}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
