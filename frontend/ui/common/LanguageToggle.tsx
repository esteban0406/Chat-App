"use client";

import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'en';

  const toggle = () => {
    i18n.changeLanguage(currentLang === 'es' ? 'en' : 'es');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={currentLang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      className="rounded-md px-2 py-1.5 text-xs font-semibold text-text-secondary transition hover:bg-surface hover:text-text-primary"
    >
      {currentLang === 'es' ? 'EN' : 'ES'}
    </button>
  );
}
