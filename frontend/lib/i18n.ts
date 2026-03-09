import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enHome from '@/locales/en/home.json';
import enChannels from '@/locales/en/channels.json';
import enServers from '@/locales/en/servers.json';
import enRoles from '@/locales/en/roles.json';
import enUser from '@/locales/en/user.json';
import enMessages from '@/locales/en/messages.json';
import enVoice from '@/locales/en/voice.json';
import enDemo from '@/locales/en/demo.json';

import esCommon from '@/locales/es/common.json';
import esAuth from '@/locales/es/auth.json';
import esHome from '@/locales/es/home.json';
import esChannels from '@/locales/es/channels.json';
import esServers from '@/locales/es/servers.json';
import esRoles from '@/locales/es/roles.json';
import esUser from '@/locales/es/user.json';
import esMessages from '@/locales/es/messages.json';
import esVoice from '@/locales/es/voice.json';
import esDemo from '@/locales/es/demo.json';

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        home: enHome,
        channels: enChannels,
        servers: enServers,
        roles: enRoles,
        user: enUser,
        messages: enMessages,
        voice: enVoice,
        demo: enDemo,
      },
      es: {
        common: esCommon,
        auth: esAuth,
        home: esHome,
        channels: esChannels,
        servers: esServers,
        roles: esRoles,
        user: esUser,
        messages: esMessages,
        voice: esVoice,
        demo: esDemo,
      },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18next-lng',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
