/** Animator instructions, deliberately separate from playable AnimationClip/import manifests. */
export interface DanceBrief {
  id: string;
  family: "halay" | "kolbasti" | "oyun-havasi" | "pop";
  title: string;
  formation: string;
  instruction: string;
  timing: string;
  takes: { male: string; female: string };
  source: string;
  status: "research-draft";
  playable: false;
}
const halay = "https://ekitap.ktb.gov.tr/TR-78840/agirlama-veya-duz-halay.html";
const kolbasti = "https://dergipark.org.tr/en/pub/ataunigsfd/article/33519";
const oyun =
  "https://kulturportali.gov.tr/turkiye/nevsehir/kulturatlasi/halk-oyunlari";
const pop =
  "https://downloads.bbc.co.uk/schoolradio/pdfs/danceworkshop_autumn_2013.pdf";
const takes = {
  male: "Erkek icracı: önden/yandan ayrı çekim; taban, ağırlık ve giysi hareketi işaretlenecek.",
  female:
    "Kadın icracı: önden/yandan ayrı çekim; taban, ağırlık ve giysi hareketi işaretlenecek. Erkek kaydı küçültülerek türetilmez.",
};
function brief(
  value: Omit<DanceBrief, "takes" | "status" | "playable">,
): DanceBrief {
  return {
    ...value,
    takes: { ...takes },
    status: "research-draft",
    playable: false,
  };
}
export const DANCE_BRIEFS: readonly DanceBrief[] = [
  brief({
    id: "halay-stationary",
    family: "halay",
    title: "Sivas Düz Halay · yerinde ayak",
    formation:
      "Altı kişilik açık zincir; küçük parmak bağlantısı aday, başçekenin dış eli mendilli.",
    instruction:
      "Sol destek üzerinde sağ kaldır–öne temas–kaldır–yerine bas/ağırlık değiştir; ardından sol ayak karşılığı. Gövde desteğin üstüne geçmeli, ayak boşta kaymamalı.",
    timing:
      "Kaynağın zaman dizisi müzik notası ve icracıyla eşlenecek; 8 beat veya 4/4 olduğu varsayılmaz.",
    source: halay,
  }),
  brief({
    id: "halay-travel",
    family: "halay",
    title: "Sivas Düz Halay · yürüyüş",
    formation: "Aynı açık zincir; liderin yönlendirmesiyle birlikte ilerleme.",
    instruction:
      "Yarım sağa yöneliş, sağ adımla başlayan yürüyüş, destek topuğu vurguları ve serbest bacağın dizden hareketi; son bölümde başlangıç yönüne dönüş. Kesin temas eğrisi performanstan çıkarılacak.",
    timing:
      "Yerinde figürle geçiş ve ölçü uzunluğu eğitmen onayına bağlı; klip henüz yok.",
    source: halay,
  }),
  brief({
    id: "kolbasti-net",
    family: "kolbasti",
    title: "Kolbastı · ağ atma / çekme motifi",
    formation: "Karşılıklı serbest alan; Halay el zinciri kullanılmaz.",
    instruction:
      "Balıkçılık jestinin hazırlık–atma–çekme anlatımını icracı kuracak; gövde/kol hareketine taban desteği eşlik edecek. Bu motif tek başına tamamlanmış Kolbastı koreografisi değildir.",
    timing:
      "Araştırmada motif belgeli, adım sayısı değil. Sayım ve ayak sırası çekimle belirlenecek.",
    source: kolbasti,
  }),
  brief({
    id: "kolbasti-row",
    family: "kolbasti",
    title: "Kolbastı · kürek çekme motifi",
    formation: "Karşılıklı veya solo icra; yöresel eğitmen yerleşimi belirler.",
    instruction:
      "Hazırlık, çekiş ve geri dönüşte ağırlık aktarımı; partner mesafesi korunacak. Akrobatik/temaslı taklitler otomatik eklenmez.",
    timing: "Müzik ve icra varyantı seçilmedi; BPM'den figür üretilmez.",
    source: kolbasti,
  }),
  brief({
    id: "oyun-kasik",
    family: "oyun-havasi",
    title: "Oyun havası · kaşık oyunu araştırması",
    formation: "Temassız karşılıklı yerleşim adayı; Nevşehir referansı.",
    instruction:
      "Kaşık kavrama, el çalma ve adım ilişkisi yöre icracısıyla hazırlanacak. Kaşık sesinin vuruşları ayrı işaretlenecek; nesne elin içine gömülmeyecek.",
    timing:
      "Oyun havası tek bir dans değildir. Belirli ezgi, usul ve erkek/kadın icra kanıtı seçilmeden kesin ayak tarifi verilmez.",
    source: oyun,
  }),
  brief({
    id: "oyun-karsilikli",
    family: "oyun-havasi",
    title: "Oyun havası · karşılıklı düzen araştırması",
    formation:
      "Nevşehir kadın oyunlarındaki temassız karşılıklı düzen kaynak referansı; erkek take ayrıca araştırılacak.",
    instruction:
      "İki icracının çağrı/yanıt dizisi için boşluk ve yön tariflenecek. Genel düğün el sallaması yöresel figür diye adlandırılmaz.",
    timing:
      "Kesin figür adı/adımı ve müzik usulü eksik; bu kayıt bir üretim sorusudur.",
    source: oyun,
  }),
  brief({
    id: "pop-step-touch",
    family: "pop",
    title: "Pop · yan adım / dokunma taslağı",
    formation: "Solo veya temassız grup; özgün basit düzenleme önerisi.",
    instruction:
      "1 sağa adım ve sağ destek, 2 sol ucu yana getir/dokun (ağırlık verme), 3 sola adım ve sol destek, 4 sağ ucu getir/dokun; 5–8 tekrarla. Kol ve gövde icracı tarafından doğal işlenecek.",
    timing:
      "8 sayımlı özgün üretim taslağı; seçilen pop müziğine uyumu ve kayıt/animasyon hakları ayrıca doğrulanacak.",
    source: pop,
  }),
  brief({
    id: "pop-forward-back",
    family: "pop",
    title: "Pop · ileri / geri dokunma taslağı",
    formation: "Solo veya temassız grup; yöresel dans iddiası yok.",
    instruction:
      "1 sağ ileri/ağırlık, 2 sol uç dokunma, 3 sol geri/ağırlık, 4 sağ uç dokunma; 5–8 diğer yönlü kısa tekrar. Mesafe, diz/kalça ve denge gerçek icrada kontrol edilecek.",
    timing:
      "Proje için özgün 8 sayım önerisi; BBC'nin hazır koreografisi veya lisanslı klibi olarak sunulmaz.",
    source: pop,
  }),
];
