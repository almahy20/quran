export interface Surah {
  id: number;
  name: string;
  englishName: string;
  totalVerses: number;
  versesText?: string[]; // Preloaded verses text for immediate study/interaction
}

export const QURAN_SURAHS: Surah[] = [
  {
    id: 1,
    name: "الفاتحة",
    englishName: "Al-Fatihah",
    totalVerses: 7,
    versesText: [
      "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
      "ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ",
      "ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
      "مَٰلِكِ يَوْمِ ٱلدِّينِ",
      "إِيَّاكَ نَعۡبُدُ وَإِيَّاكَ نَسۡتَعِينُ",
      "ٱهۡدِنَا ٱلصِّرَٰطَ ٱلۡمُسۡتَقِيمَ",
      "صِرَٰطَ ٱلَّذِينَ أَنۡعَمۡتَ عَلَيۡهِمۡ غَيۡرِ ٱلۡمَغۡضُوبِ عَلَيۡهِمۡ وَلَا ٱلضَّآلِّينَ"
    ]
  },
  {
    id: 97,
    name: "القدر",
    englishName: "Al-Qadr",
    totalVerses: 5,
    versesText: [
      "إِنَّآ أَنزَلۡنَٰهُ فِي لَيۡلَةِ ٱلۡقَدۡرِ",
      "وَمَآ أَدۡرَىٰكَ مَا لَيۡلَةُ ٱلۡقَدۡرِ",
      "لَيۡلَةُ ٱلۡقَدۡرِ خَيۡرٌ مِّنۡ أَلۡفِ شَهۡرٍ",
      "تَنَزَّلُ ٱلۡمَلَٰٓئِكَةُ وَٱلرُّوحُ فِيهَا بِإِذۡنِ رَبِّهِم مِّن كُلِّ أَمۡرٍ",
      "سَلَٰمٌ هِيَ حَتَّىٰ مَطۡلَعِ ٱلۡفَجۡرِ"
    ]
  },
  {
    id: 103,
    name: "العصر",
    englishName: "Al-Asr",
    totalVerses: 3,
    versesText: [
      "وَٱلۡعَصۡرِ",
      "إِنَّ ٱلۡإِنسَٰنَ لَفِي خُسۡرٍ",
      "إِلَّا ٱلَّذِينَ ءَامَنُواْ وَعَمِلُواْ ٱلصَّٰلِحَٰتِ وَتَوَاصَوۡاْ بِٱلۡحَقِّ وَتَوَاصَوۡاْ بِٱلصَّبۡرِ"
    ]
  },
  {
    id: 108,
    name: "الكوثر",
    englishName: "Al-Kauthar",
    totalVerses: 3,
    versesText: [
      "إِنَّآ أَعۡطَيۡنَٰكَ ٱلۡكَوْثَرَ",
      "فَصَلِّ لِرَبِّكَ وَٱنۡحَرۡ",
      "إِنَّ شَانِئَكَ هُوَ ٱلۡأَبۡتَرُ"
    ]
  },
  {
    id: 112,
    name: "الإخلاص",
    englishName: "Al-Ikhlas",
    totalVerses: 4,
    versesText: [
      "قُلۡ هُوَ ٱللَّهُ أَحَدٌ",
      "ٱللَّهُ ٱلصَّمَدُ",
      "لَمۡ يَلِدۡ وَلَمۡ يُولَدۡ",
      "وَمَلۡ يَكُن لَّهُۥ كُفُوًا أَحَدٌ"
    ]
  },
  {
    id: 113,
    name: "الفلق",
    englishName: "Al-Falaq",
    totalVerses: 5,
    versesText: [
      "قُلۡ أَعُوذُ بِرَبِّ ٱلۡفَلَقِ",
      "مِن شَرِّ مَا خَلَقَ",
      "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
      "وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِي ٱلۡعُقَدِ",
      "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ"
    ]
  },
  {
    id: 114,
    name: "الناس",
    englishName: "An-Nas",
    totalVerses: 6,
    versesText: [
      "قُلۡ أَعُوذُ بِرَبِّ ٱلنَّاسِ",
      "مَلِكِ ٱلنَّاسِ",
      "إِلَٰهِ ٱلنَّاسِ",
      "مِن شَرِّ ٱلۡوَسۡوَاسِ ٱلۡخَنَّاسِ",
      "ٱلَّذِي يُوَسۡوِسُ فِي صُدُورِ ٱلنَّاسِ",
      "مِنَ ٱلۡجِنَّةِ وَٱلنَّاسِ"
    ]
  },
  // Other chapters of Amma part for selection metadata
  { id: 78, name: "النبأ", englishName: "An-Naba", totalVerses: 40 },
  { id: 79, name: "النازعات", englishName: "An-Naziat", totalVerses: 46 },
  { id: 80, name: "عبس", englishName: "Abasa", totalVerses: 42 },
  { id: 81, name: "التكوير", englishName: "At-Takwir", totalVerses: 29 },
  { id: 82, name: "الانفطار", englishName: "Al-Infitar", totalVerses: 19 },
  { id: 83, name: "المطففين", englishName: "Al-Mutaffifin", totalVerses: 36 },
  { id: 84, name: "الانشقاق", englishName: "Al-Inshiqaq", totalVerses: 25 },
  { id: 85, name: "البروج", englishName: "Al-Buruj", totalVerses: 22 },
  { id: 86, name: "الطارق", englishName: "At-Tariq", totalVerses: 17 },
  { id: 87, name: "الأعلى", englishName: "Al-Ala", totalVerses: 19 },
  { id: 88, name: "الغاشية", englishName: "Al-Ghashiyah", totalVerses: 26 },
  { id: 89, name: "الفجر", englishName: "Al-Fajr", totalVerses: 30 },
  { id: 90, name: "البلد", englishName: "Al-Balad", totalVerses: 20 },
  { id: 91, name: "الشمس", englishName: "Ash-Shams", totalVerses: 15 },
  { id: 92, name: "الليل", englishName: "Al-Lail", totalVerses: 21 },
  { id: 93, name: "الضحى", englishName: "Ad-Duha", totalVerses: 11 },
  { id: 94, name: "الشرح", englishName: "Al-Inshirah", totalVerses: 8 },
  { id: 95, name: "التين", englishName: "At-Tin", totalVerses: 8 },
  { id: 96, name: "العلق", englishName: "Al-Alaq", totalVerses: 19 },
  { id: 98, name: "البينة", englishName: "Al-Bayyinah", totalVerses: 8 },
  { id: 99, name: "الزلزلة", englishName: "Al-Zalzalah", totalVerses: 8 },
  { id: 100, name: "العاديات", englishName: "Al-Adiyat", totalVerses: 11 },
  { id: 101, name: "القارعة", englishName: "Al-Qari'ah", totalVerses: 11 },
  { id: 102, name: "التكاثر", englishName: "At-Takathur", totalVerses: 8 },
  { id: 104, name: "الهمزة", englishName: "Al-Humazah", totalVerses: 9 },
  { id: 105, name: "الفيل", englishName: "Al-Fil", totalVerses: 5 },
  { id: 106, name: "قريش", englishName: "Quraish", totalVerses: 4 },
  { id: 107, name: "الماعون", englishName: "Al-Ma'un", totalVerses: 7 },
  { id: 109, name: "الكافرون", englishName: "Al-Kafirun", totalVerses: 6 },
  { id: 110, name: "النصر", englishName: "An-Nasr", totalVerses: 3 },
  { id: 111, name: "المسد", englishName: "Al-Masad", totalVerses: 5 }
];
