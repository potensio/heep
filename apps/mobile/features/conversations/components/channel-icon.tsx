import React from 'react';
import {
  WhatsappLogoIcon,
  DeviceMobileIcon,
  EnvelopeSimpleIcon,
  InstagramLogoIcon,
  MessengerLogoIcon,
  TelegramLogoIcon,
  PhoneCallIcon,
  TerminalWindowIcon,
  SparkleIcon,
  AppleLogoIcon,
} from 'phosphor-react-native';
import type { Channel } from '../types';

type Props = { channel: Channel; size?: number };

export function ChannelIcon({ channel, size = 16 }: Props) {
  const p = { size, weight: 'fill' as const };
  switch (channel) {
    case 'whatsapp':       return <WhatsappLogoIcon   {...p} color="#25D366" />;
    case 'sms':
    case 'sms-/-rcs':      return <DeviceMobileIcon   {...p} color="#34C759" />;
    case 'email':          return <EnvelopeSimpleIcon {...p} color="#007AFF" />;
    case 'instagram':      return <InstagramLogoIcon  {...p} color="#E1306C" />;
    case 'messenger':      return <MessengerLogoIcon  {...p} color="#0084FF" />;
    case 'telegram':       return <TelegramLogoIcon   {...p} color="#229ED9" />;
    case 'voice':          return <PhoneCallIcon      {...p} color="#34C759" />;
    case 'playground':     return <TerminalWindowIcon {...p} color="#F59E0B" />;
    case 'heep-copilot':   return <SparkleIcon        {...p} color="#8B5CF6" />;
    case 'imessage':       return <AppleLogoIcon      {...p} color="#1C1C1E" />;
    default:               return <WhatsappLogoIcon   {...p} color="#25D366" />;
  }
}
