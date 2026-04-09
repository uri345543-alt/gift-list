import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <select 
      onChange={(e) => changeLanguage(e.target.value)} 
      value={i18n.language}
      className="language-select"
    >
      <option value="en">EN</option>
      <option value="es">ES</option>
      <option value="ca">CA</option>
    </select>
  );
};

export default LanguageSwitcher;
