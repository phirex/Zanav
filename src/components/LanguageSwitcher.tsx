"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-muted-foreground">
        {t("languageLabel")}
      </span>
      <Button
        variant={i18n.language === "en" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => changeLanguage("en")}
        disabled={i18n.language === "en"}
      >
        EN
      </Button>
      <Button
        variant={i18n.language === "he" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => changeLanguage("he")}
        disabled={i18n.language === "he"}
      >
        HE
      </Button>
    </div>
  );
}
