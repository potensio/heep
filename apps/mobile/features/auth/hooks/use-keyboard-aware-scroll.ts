import { useRef, useState, useEffect, useCallback } from 'react';
import { Keyboard, Platform, ScrollView, View } from 'react-native';

export function useKeyboardAwareScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const scrollToInput = useCallback((ref: React.RefObject<View | null>) => {
    setTimeout(() => {
      if (!ref.current || !scrollRef.current) return;
      (ref.current as any).measureLayout(
        scrollRef.current as any,
        (_x: number, y: number) => {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
        },
        () => {}
      );
    }, 200);
  }, []);

  return { scrollRef, keyboardHeight, scrollToInput };
}
