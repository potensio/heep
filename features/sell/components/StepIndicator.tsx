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
          <View key={stepNumber} className="flex-row items-start">
            {/* Circle with Label */}
            <View className="items-center">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isActive
                    ? 'bg-primary'
                    : isCompleted
                    ? 'bg-primary'
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
                  isActive ? 'text-primary font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </Text>
            </View>

            {/* Connector Line - aligned to center of circle */}
            {!isLast && (
              <View className="h-8 justify-center">
                <View
                  className={`w-12 h-0.5 mx-2 ${
                    isCompleted ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
