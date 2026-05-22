// features/sell/components/StepIndicator.tsx
import { View, Text } from 'react-native';
import type { WizardStep } from '../types';

interface StepIndicatorProps {
  currentStep: WizardStep;
  stepLabels: string[];
}

export function StepIndicator({ currentStep, stepLabels }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center px-5 py-3">
      {stepLabels.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const isLast = index === stepLabels.length - 1;

        return (
          <View key={stepNumber} className="flex-row items-center">
            {/* Step Number */}
            <View
              className={`w-5 h-5 rounded-full items-center justify-center ${
                isActive || isCompleted ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isActive || isCompleted ? 'text-white' : 'text-gray-500'
                }`}
              >
                {stepNumber}
              </Text>
            </View>

            {/* Label */}
            <Text
              className={`text-xs ml-1.5 mr-2 ${
                isActive || isCompleted ? 'text-black font-medium' : 'text-gray-400'
              }`}
            >
              {label}
            </Text>

            {/* Connector Line */}
            {!isLast && (
              <View
                className={`h-0.5 w-4 mr-2 ${
                  isCompleted ? 'bg-black' : 'bg-gray-200'
                }`}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
