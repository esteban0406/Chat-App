import '@testing-library/jest-dom';

/* eslint-disable @typescript-eslint/no-require-imports */
const esCommon = require('../locales/es/common.json');
const esAuth = require('../locales/es/auth.json');
const esHome = require('../locales/es/home.json');
const esChannels = require('../locales/es/channels.json');
const esServers = require('../locales/es/servers.json');
const esRoles = require('../locales/es/roles.json');
const esUser = require('../locales/es/user.json');
const esMessages = require('../locales/es/messages.json');
const esVoice = require('../locales/es/voice.json');

const namespaces: Record<string, Record<string, unknown>> = {
  common: esCommon,
  auth: esAuth,
  home: esHome,
  channels: esChannels,
  servers: esServers,
  roles: esRoles,
  user: esUser,
  messages: esMessages,
  voice: esVoice,
};

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

function createT(defaultNs: string | string[]) {
  const primaryNs = Array.isArray(defaultNs) ? defaultNs[0] : (defaultNs || 'common');

  return (key: string, options?: Record<string, unknown>) => {
    let ns = primaryNs;
    let lookupKey = key;

    // Handle namespace:key syntax
    if (key.includes(':')) {
      const [nsPrefix, rest] = key.split(':');
      ns = nsPrefix;
      lookupKey = rest;
    }

    const nsData = namespaces[ns];
    if (!nsData) return key;

    let value = getNestedValue(nsData, lookupKey);

    // Handle interpolation {{var}}
    if (options && typeof value === 'string') {
      value = value.replace(/\{\{(\w+)\}\}/g, (_, varName) =>
        options[varName] != null ? String(options[varName]) : `{{${varName}}}`
      );
    }

    return value;
  };
}

jest.mock('react-i18next', () => ({
  useTranslation: (ns?: string | string[]) => ({
    t: createT(ns ?? 'common'),
    i18n: {
      changeLanguage: jest.fn(),
      language: 'es',
    },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
