import { View, Text, TouchableOpacity } from "react-native";
import { useLanguage, type Language } from "@/src/hooks/use-language";

export function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "id", label: "ID" },
  ];

  return (
    <View className="flex-row items-center gap-1">
      {languages.map((lang, index) => (
        <View key={lang.code} className="flex-row items-center">
          <TouchableOpacity
            onPress={() => changeLanguage(lang.code)}
            className="px-1 py-0.5"
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                currentLanguage === lang.code
                  ? "text-[#F04E30]"
                  : "text-[#8A8A8A]"
              }`}
            >
              {lang.label}
            </Text>
          </TouchableOpacity>
          {index < languages.length - 1 && (
            <Text className="text-[#8A8A8A] text-sm mx-0.5">|</Text>
          )}
        </View>
      ))}
    </View>
  );
}
