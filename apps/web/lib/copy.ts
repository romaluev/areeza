export type AppLocale = "uz" | "ru";

export const PIPELINE_STEPS = [
  { id: "describe", label: "Tasvirlang" },
  { id: "classify", label: "Tasniflang" },
  { id: "route", label: "Yo'naltiring" },
  { id: "prepare", label: "Tayyorlang" },
  { id: "validate", label: "Tekshiring" },
  { id: "submit", label: "Topshiring" },
] as const;

/** Case pipeline statuses (legacy `/cases` API). */
export const STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  intake: "Murojaat",
  classified: "Tasniflangan",
  routed: "Marshrut",
  drafted: "Hujjat tayyor",
  validated: "Tekshirilgan",
  ready: "Topshirishga tayyor",
};

/** Situation list / workspace statuses — includes `in_progress`. */
export const SITUATION_STATUS_LABELS: Record<AppLocale, Record<string, string>> = {
  uz: {
    draft: "Qoralama",
    intake: "Murojaat",
    in_progress: "Jarayonda",
    validated: "Tekshirilgan",
    ready: "Topshirishga tayyor",
  },
  ru: {
    draft: "Черновик",
    intake: "Приём",
    in_progress: "В работе",
    validated: "Проверено",
    ready: "Готово к подаче",
  },
};

export function situationStatusLabel(status: string, locale: AppLocale): string {
  return SITUATION_STATUS_LABELS[locale][status] ?? status;
}

export const COMPLIANCE_NOTE = {
  uz: "Areeza yuridik maslahat bermaydi. U yo'naltirish, tayyorlash va tekshirish vositasi; topshirish qarori fuqaroning o'zida qoladi.",
  ru: "Areeza не даёт юридических консультаций. Это инструмент навигации, подготовки и проверки; решение о подаче остаётся за вами.",
} as const;

export const UI_COPY = {
  uz: {
    situationsHomeTitle: "Mening holatlarim",
    situationsHomeSubtitle: "Har bir holat — bir nechta masala va hujjat",
    newSituation: "Yangi holat",
    emptySituationsTitle: "Hali holat yo'q",
    emptySituationsDescription:
      "Muammoingizni oddiy tilda yozing — Areeza to'g'ri yo'nalish va hujjatlarni tayyorlaydi.",
    startFirstSituation: "Birinchi holatni boshlash",
    documentsReady: (ready: number, total: number) =>
      `${ready}/${total} hujjat tayyor`,
    updatedAt: (formatted: string) => `Yangilangan: ${formatted}`,
    listLoadErrorTitle: "Ro'yxat yuklanmadi",
    listLoadErrorDescription:
      "Internet yoki server bilan bog'liq muammo bo'lishi mumkin.",
    retry: "Qayta urinish",
    openSituation: (title: string) => `Holatni ochish: ${title}`,
    segmentErrorTitle: "Nimadir noto'g'ri ketdi",
    segmentErrorDescription: "Sahifani yangilab ko'ring yoki holatlar ro'yxatiga qayting.",
    homeLink: "Holatlarim",
    boardLink: "Doska",
    boardTitle: "Doska",
    boardSubtitle: "Holatlar va masalalarni bosqichlar bo'yicha tartibga soling",
    boardViewCases: "Holatlar",
    boardViewIssues: "Masalalar",
    globalErrorTitle: "Areeza vaqtincha ishlamayapti",
    globalErrorDescription:
      "Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring yoki bosh sahifaga qayting.",
    notFoundTitle: "Holat topilmadi",
    notFoundDescription:
      "Bu havola eskirgan yoki holat o'chirilgan bo'lishi mumkin. Yangi holat boshlang yoki ro'yxatga qayting.",
    newSituationCta: "Yangi holat boshlash",
    deleteSituationTitle: "Holatni o'chirish",
    deleteSituationDescription:
      "Bu holat, masalalar va hujjatlar demo rejimida butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.",
    deleteConfirm: "O'chirish",
    deleteCancel: "Bekor qilish",
    skipLink: "Asosiy kontentga o'tish",
    localeUz: "O'zbekcha",
    localeRu: "Русский",
    newSituationPageTitle: "Yangi holat",
    newSituationPageSubtitle:
      "Vaziyatingizni tasvirlang — Areeza yo'nalishlarni aniqlaydi.",
    assistantRailTitle: "Yordamchi",
    assistantRailClose: "Yopish",
    assistantRailToggle: "Yordamchini ochish",
    settingsTitle: "Sozlamalar",
    settingsOpen: "Sozlamalar",
    settingsTheme: "Mavzu",
    settingsThemeLight: "Yorug'",
    settingsThemeDark: "Qorong'u",
    settingsThemeSystem: "Tizim",
    settingsLanguage: "Til",
    settingsDensity: "Zichlik",
    settingsDensityComfortable: "Qulay",
    settingsDensityCompact: "Ixcham",
    settingsShape: "Shakl",
    settingsShapeDefault: "Yumaloq",
    settingsShapePill: "Tabletka",
    factsTitle: "Yig'ilgan faktlar",
    factsEmpty: "Suhbat davomida faktlar shu yerda paydo bo'ladi.",
    factsMissingValue: "— ko'rsatilmagan",
  },
  ru: {
    situationsHomeTitle: "Мои ситуации",
    situationsHomeSubtitle: "Каждая ситуация — несколько вопросов и документов",
    newSituation: "Новая ситуация",
    emptySituationsTitle: "Ситуаций пока нет",
    emptySituationsDescription:
      "Опишите проблему простым языком — Areeza подберёт направление и документы.",
    startFirstSituation: "Начать первую ситуацию",
    documentsReady: (ready: number, total: number) =>
      `Готово документов: ${ready}/${total}`,
    updatedAt: (formatted: string) => `Обновлено: ${formatted}`,
    listLoadErrorTitle: "Не удалось загрузить список",
    listLoadErrorDescription:
      "Возможна проблема с сетью или сервером.",
    retry: "Повторить",
    openSituation: (title: string) => `Открыть ситуацию: ${title}`,
    segmentErrorTitle: "Что-то пошло не так",
    segmentErrorDescription: "Обновите страницу или вернитесь к списку ситуаций.",
    homeLink: "Мои ситуации",
    boardLink: "Доска",
    boardTitle: "Доска",
    boardSubtitle: "Организуйте ситуации и задачи по этапам",
    boardViewCases: "Ситуации",
    boardViewIssues: "Задачи",
    globalErrorTitle: "Areeza временно недоступна",
    globalErrorDescription:
      "Произошла непредвиденная ошибка. Повторите попытку или вернитесь на главную.",
    notFoundTitle: "Ситуация не найдена",
    notFoundDescription:
      "Ссылка устарела или ситуация удалена. Начните новую или вернитесь к списку.",
    newSituationCta: "Новая ситуация",
    deleteSituationTitle: "Удалить ситуацию",
    deleteSituationDescription:
      "Ситуация, вопросы и документы будут удалены в демо-режиме. Это действие нельзя отменить.",
    deleteConfirm: "Удалить",
    deleteCancel: "Отмена",
    skipLink: "Перейти к основному содержимому",
    localeUz: "O'zbekcha",
    localeRu: "Русский",
    newSituationPageTitle: "Новая ситуация",
    newSituationPageSubtitle:
      "Опишите ситуацию — Areeza определит направления.",
    assistantRailTitle: "Помощник",
    assistantRailClose: "Закрыть",
    assistantRailToggle: "Открыть помощника",
    settingsTitle: "Параметры",
    settingsOpen: "Параметры",
    settingsTheme: "Тема",
    settingsThemeLight: "Светлая",
    settingsThemeDark: "Тёмная",
    settingsThemeSystem: "Система",
    settingsLanguage: "Язык",
    settingsDensity: "Плотность",
    settingsDensityComfortable: "Удобно",
    settingsDensityCompact: "Компактно",
    settingsShape: "Форма",
    settingsShapeDefault: "Скруглённая",
    settingsShapePill: "Таблетка",
    factsTitle: "Собранные факты",
    factsEmpty: "Факты появятся здесь по ходу разговора.",
    factsMissingValue: "— не указано",
  },
} as const;

export type LandingCopy = (typeof LANDING_COPY)[AppLocale];

export function uiCopy(locale: AppLocale) {
  return UI_COPY[locale];
}

export const LANDING_COPY = {
  uz: {
    heroBadge: "Oliy sud maslahatchilari bilan ishlab chiqilgan",
    heroTitle: "Muammoingizni oddiy tilda yozing —",
    heroTitleAccent: "to'g'ri sud hujjatigacha",
    heroBody:
      "Areeza bir suhbatda faktlarni yig'adi, yo'nalishni aniqlaydi, da'vo arizasini MKPK 189 bo'yicha tayyorlaydi va topshirishdan oldin tekshiradi.",
    demoCta: "Ish haqi demosini ko'rish",
    signIn: "Kirish",
    trust1: "Yuridik maslahat emas — tayyorlash vositasi",
    trust2: "MKPK 189 bo'yicha tuzilma",
    trust3: "Inson nazoratida topshirish",
    comingSoonBadge: "Keyingi bosqich",
    comingSoonTitle: "e-sud orqali to'g'ridan-to'g'ri topshirish",
    comingSoonBody:
      "Bugun Areeza sud formatidagi PDF paketini tayyorlaydi va my.sud.uz bo'yicha yo'riqnoma beradi — to'liq ariza tayyorlash zanjiri allaqachon ishlaydi.",
    ctaTitle: "Birinchi arizangizni tayyorlang",
    ctaBody:
      "To'lanmagan ish haqi bo'yicha tayyor holatni oching — suhbatdan PDF eksportgacha butun jarayonni ko'ring.",
    ctaDemo: "Ish haqi demosini ko'rish",
    myCases: "Mening holatlarim",
    mainAriaLabel: "Areeza bosh sahifa",
    esudLabel: "my.sud.uz",
    esudHint: "Elektron sud kabineti",
    transformation: {
      eyebrow: "O'zgarish",
      title: "Chalkash gapdan — sud hujjatigacha",
      description:
        "Areeza fuqaroning oddiy tili va sud talab qiladigan protsessual format o'rtasidagi bo'shliqni yopadi.",
      beforeLabel: "Oldin",
      afterLabel: "Keyin",
      beforeQuote:
        "«Ish beruvchi 4 oy ish haqini bermadi. Qayerga murojaat qilishni bilmayman. e-sudda qaysi shaklni tanlash kerak?»",
      beforeTags: ["Qaysi sud?", "Noto'g'ri shakl", "Qaytarilgan ariza"],
      courtName: "Andijon viloyati, Andijon shahar fuqarolik sudi",
      docTitle: "DA'VO ARIZASI",
      docSubtitle: "mehnat munosabatlari bo'yicha",
      plaintiff: "Da'vogar: Aliyev A.A.",
      defendant: "Javobgar: «Oltin tex» MChJ",
      claimAmount: "Da'vo bahosi: 12 800 000 so'm",
      verified: "MKPK 189 · tekshirilgan",
    },
    stats: {
      eyebrow: "Dalillar",
      title: "Raqamlar va ishonch",
      description: "Sud tizimi o'smoqda — fuqarolar uchun tayyorlash qatlami hali yetishmaydi.",
      items: [
        {
          label: "Yillik fuqarolik ishlar",
          value: "2M+",
          hint: "O'zbekiston sudlarida, +50% o'sish",
          icon: "scale" as const,
        },
        {
          label: "Protsessual tuzilma",
          value: "MKPK 189",
          hint: "Da'vo arizasi shabloni bo'yicha",
          icon: "file" as const,
        },
        {
          label: "Tekshiruv qadamlari",
          value: "12+",
          hint: "Qaytarish xavfini kamaytirish uchun",
          icon: "fileCheck" as const,
        },
        {
          label: "Maslahat",
          value: "Oliy sud",
          hint: "IT muhandislari bilan ishlab chiqilgan",
          icon: "shield" as const,
        },
      ],
    },
    howItWorks: {
      eyebrow: "Jarayon",
      title: "Qanday ishlaydi",
      description: "To'rt qadam: tasvirlang, tayyorlang, tekshiring, yuklab oling.",
      steps: [
        {
          step: "01",
          title: "Tasvirlang",
          body: "Oddiy tilda yozing — Areeza bir vaqtning o'zida bitta savol beradi va faktlarni yig'adi.",
          icon: "user" as const,
        },
        {
          step: "02",
          title: "Tayyorlang",
          body: "To'g'ri sud, ariza turi va MKPK 189 bo'yicha tuzilgan da'vo arizasi — shablon + faktlar.",
          icon: "file" as const,
        },
        {
          step: "03",
          title: "Tekshiring",
          body: "Majburiy maydonlar, davlat boji, muddat va yurisdiksiya bo'yicha avtomatik tekshiruv.",
          icon: "fileCheck" as const,
        },
        {
          step: "04",
          title: "Yuklab oling",
          body: "Sud formatidagi PDF paketini yuklab oling va e-sud bo'yicha qadam-baqadam yo'riqnoma.",
          icon: "download" as const,
        },
      ],
    },
    scenarios: {
      eyebrow: "Misol holatlar",
      title: "Har qanday murakkab vaziyat",
      description: "Bir suhbat — bir nechta masala, hujjat va forum.",
      start: "Boshlash",
      openReady: "Tayyor holat",
      items: [
        {
          title: "Meni aldashdi",
          href: "/situations/new?scenario=fraud",
          body: "Investitsiya, jinoiy shikoyat, korrupsiya, politsiya harakatsizligi — 4 hujjat.",
        },
        {
          title: "Ishdan bo'shatishdi",
          href: "/situations/new?scenario=workplace",
          body: "Ish haqi, ishga qaytarish (1 oy muddat!), bezorilik, inspeksiya.",
        },
        {
          title: "Aliment va kvartira",
          href: "/situations/new?scenario=divorce",
          body: "Aliment, mulk bo'linishi, shoshilinch ta'minlov.",
        },
        {
          title: "Ish haqi (klassik)",
          href: "/situations/new?demo=1",
          body: "Bitta masala — to'liq tayyor da'vo arizasi.",
        },
      ],
    },
  },
  ru: {
    heroBadge: "Разработано с консультантами Верховного суда",
    heroTitle: "Опишите ситуацию простым языком —",
    heroTitleAccent: "до готового судебного документа",
    heroBody:
      "Areeza собирает факты в одном диалоге, определяет направление, готовит иск по ст. 189 ГПК и проверяет пакет перед подачей.",
    demoCta: "Смотреть демо по зарплате",
    signIn: "Войти",
    trust1: "Не юридическая консультация — инструмент подготовки",
    trust2: "Структура по ст. 189 ГПК",
    trust3: "Подача под вашим контролем",
    comingSoonBadge: "Следующий этап",
    comingSoonTitle: "Прямая подача через e-sud",
    comingSoonBody:
      "Сейчас Areeza готовит PDF в судебном формате и даёт инструкцию для my.sud.uz — полная цепочка подготовки заявления уже работает.",
    ctaTitle: "Подготовьте первое заявление",
    ctaBody:
      "Откройте готовую ситуацию по невыплате зарплаты — от диалога до экспорта PDF.",
    ctaDemo: "Смотреть демо по зарплате",
    myCases: "Мои ситуации",
    mainAriaLabel: "Главная Areeza",
    esudLabel: "my.sud.uz",
    esudHint: "Электронный кабинет суда",
    transformation: {
      eyebrow: "Изменение",
      title: "От простого описания — к судебному документу",
      description:
        "Areeza закрывает разрыв между простым языком гражданина и процессуальным форматом суда.",
      beforeLabel: "До",
      afterLabel: "После",
      beforeQuote:
        "«Работодатель 4 месяца не платил зарплату. Не знаю, куда обращаться. Какую форму выбрать в e-sud?»",
      beforeTags: ["Какой суд?", "Неверная форма", "Возвращённое заявление"],
      courtName: "Андижанский областной, гражданский суд г. Андижана",
      docTitle: "ИСКОВОЕ ЗАЯВЛЕНИЕ",
      docSubtitle: "по трудовым отношениям",
      plaintiff: "Истец: Алиев А.А.",
      defendant: "Ответчик: ООО «Oltin tex»",
      claimAmount: "Цена иска: 12 800 000 сум",
      verified: "ГПК 189 · проверено",
    },
    stats: {
      eyebrow: "Доказательства",
      title: "Цифры и доверие",
      description:
        "Судебная система растёт — слой подготовки для граждан пока недостаточен.",
      items: [
        {
          label: "Гражданских дел в год",
          value: "2M+",
          hint: "В судах Узбекистана, +50% рост",
          icon: "scale" as const,
        },
        {
          label: "Процессуальная структура",
          value: "ГПК 189",
          hint: "По шаблону искового заявления",
          icon: "file" as const,
        },
        {
          label: "Шагов проверки",
          value: "12+",
          hint: "Чтобы снизить риск возврата",
          icon: "fileCheck" as const,
        },
        {
          label: "Консультанты",
          value: "Верховный суд",
          hint: "Разработано с IT-инженерами",
          icon: "shield" as const,
        },
      ],
    },
    howItWorks: {
      eyebrow: "Процесс",
      title: "Как это работает",
      description: "Четыре шага: опишите, подготовьте, проверьте, скачайте.",
      steps: [
        {
          step: "01",
          title: "Опишите",
          body: "Пишите простым языком — Areeza задаёт один вопрос за раз и собирает факты.",
          icon: "user" as const,
        },
        {
          step: "02",
          title: "Подготовьте",
          body: "Правильный суд, тип заявления и иск по ст. 189 ГПК — шаблон + факты.",
          icon: "file" as const,
        },
        {
          step: "03",
          title: "Проверьте",
          body: "Автоматическая проверка обязательных полей, госпошлины, сроков и подсудности.",
          icon: "fileCheck" as const,
        },
        {
          step: "04",
          title: "Скачайте",
          body: "Скачайте PDF в судебном формате и пошаговую инструкцию для e-sud.",
          icon: "download" as const,
        },
      ],
    },
    scenarios: {
      eyebrow: "Примеры ситуаций",
      title: "Любая сложная ситуация",
      description: "Один диалог — несколько вопросов, документов и форумов.",
      start: "Начать",
      openReady: "Готовая ситуация",
      items: [
        {
          title: "Меня обманули",
          href: "/situations/new?scenario=fraud",
          body: "Инвестиции, уголовная жалоба, коррупция, бездействие полиции — 4 документа.",
        },
        {
          title: "Уволили с работы",
          href: "/situations/new?scenario=workplace",
          body: "Зарплата, восстановление (срок 1 месяц!), домогательства, инспекция.",
        },
        {
          title: "Алименты и квартира",
          href: "/situations/new?scenario=divorce",
          body: "Алименты, раздел имущества, срочные меры.",
        },
        {
          title: "Зарплата (классика)",
          href: "/situations/new?demo=1",
          body: "Один вопрос — полностью готовое исковое заявление.",
        },
      ],
    },
  },
} as const;
