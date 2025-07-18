export const i18n = {
  defaultLocale: "en",
  locales: [
    "ab",
    "ace",
    "ach",
    "aa",
    "af",
    "sq",
    "aaz",
    "am",
    "ar",
    "hy",
    "as",
    "av",
    "awa",
    "ay",
    "az",
    "ban",
    "bal",
    "bm",
    "bci",
    "ba",
    "eu",
    "btx",
    "bts",
    "bbc",
    "be",
    "bem",
    "bn",
    "bew",
    "bho",
    "bik",
    "bs",
    "br",
    "bg",
    "bua",
    "yue",
    "ca",
    "ceb",
    "ch",
    "ce",
    "ny",
    "zh-cn",
    "zh-tw",
    "chk",
    "cv",
    "co",
    "crh-cyrl",
    "crh-latn",
    "hr",
    "cs",
    "da",
    "prs",
    "dv",
    "din",
    "doi",
    "dov",
    "nl",
    "dyu",
    "dz",
    "en",
    "eo",
    "et",
    "ee",
    "fo",
    "fj",
    "fil",
    "fi",
    "fon",
    "fr",
    "fr-ca",
    "fy",
    "fur",
    "ff",
    "gaa",
    "gl",
    "ka",
    "de",
    "el",
    "gn",
    "gu",
    "ht",
    "cnh",
    "ha",
    "haw",
    "he",
    "hil",
    "hi",
    "hmn",
    "hu",
    "hrx",
    "iba",
    "is",
    "ig",
    "ilo",
    "id",
    "iu-latn",
    "iu",
    "ga",
    "it",
    "jam",
    "ja",
    "jv",
    "kac",
    "kl",
    "kn",
    "kr",
    "pam",
    "kk",
    "kha",
    "km",
    "cgg",
    "kg",
    "rw",
    "ktu",
    "trp",
    "kv",
    "gom",
    "ko",
    "kri",
    "ku",
    "ckb",
    "ky",
    "lo",
    "ltg",
    "la",
    "lv",
    "lij",
    "li",
    "ln",
    "lt",
    "lmo",
    "lg",
    "luo",
    "lb",
    "mk",
    "mad",
    "mai",
    "mak",
    "mg",
    "ms",
    "ms-arab",
    "ml",
    "mt",
    "mam",
    "gv",
    "mi",
    "mr",
    "mh",
    "mwr",
    "mfe",
    "mhr",
    "mni",
    "min",
    "lus",
    "mn",
    "my",
    "nhe",
    "ndc",
    "nr",
    "new",
    "ne",
    "nqo",
    "no",
    "nus",
    "oc",
    "or",
    "om",
    "os",
    "pag",
    "pap",
    "ps",
    "fa",
    "pl",
    "pt-br",
    "pt-pt",
    "pa-guru",
    "pa-arab",
    "qu",
    "kek",
    "rom",
    "ro",
    "rn",
    "ru",
    "se",
    "sm",
    "sg",
    "sa",
    "sat-latn",
    "sat",
    "gd",
    "nso",
    "sr",
    "st",
    "crs",
    "shn",
    "sn",
    "scn",
    "szl",
    "sd",
    "si",
    "sk",
    "sl",
    "so",
    "es",
    "su",
    "sus",
    "sw",
    "ss",
    "sv",
    "ty",
    "tg",
    "zgh",
    "zgh-tfng",
    "ta",
    "tt",
    "te",
    "tet",
    "th",
    "bo",
    "ti",
    "tiv",
    "tpi",
    "to",
    "lua",
    "ts",
    "tn",
    "tcy",
    "tum",
    "tr",
    "tk",
    "tyv",
    "ak",
    "udm",
    "uk",
    "ur",
    "ug",
    "uz",
    "ve",
    "vec",
    "vi",
    "war",
    "cy",
    "wo",
    "xh",
    "sah",
    "yi",
    "yo",
    "yua",
    "zap",
    "zu",
  ],

} as const;

export type Locale = (typeof i18n)["locales"][number];

