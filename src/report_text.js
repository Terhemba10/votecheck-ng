// Wording for the template observer report, in the five supported languages.
// Only the wording changes between languages: the flags, numbers and severities come from the rules in checker.js.
// Every flag message stays neutral: a flag means "verify this", never "fraud".

export const REPORT_TEXT = {
  "English": {
    labels: { critical: "Critical", warning: "Warning", review: "Review" },
    none: "No polling units were flagged. Result sheets match IReV and no rule was triggered.",
    summary: (n, f) => `Summary: ${n} polling units checked, ${f} flagged for verification.`,
    flags: {
      accredited_exceeds_registered: d => `Accredited voters (${d.accredited}) exceed registered voters (${d.registered}).`,
      over_voting: d => `Over-voting: ${d.cast} votes cast but only ${d.accredited} voters accredited.`,
      missing_irev: () => "No IReV upload found. The Electoral Act 2026 requires electronic transmission of polling-unit results.",
      irev_mismatch: d => `Party ${d.party}: result sheet shows ${d.paper}, IReV shows ${d.irev} (${d.diff}).`,
      high_turnout: d => `Turnout of ${d.turnout} is unusually high.`,
      turnout_outlier: d => `Turnout of ${d.turnout} is far from the area's typical ${d.median}.`,
      one_sided: d => `One party received ${d.share} of valid votes. Worth confirming against the result sheet.`,
      zero_accredited: () => "Zero voters accredited. Check whether voting held or the unit was cancelled.",
    },
    next: "Next steps for observers:\n1. Compare each flagged unit's physical Form EC8A with its IReV upload.\n" +
      "2. Ask party agents and observers present at the unit what they recorded.\n" +
      "3. Report confirmed issues to INEC through official channels.\n" +
      "These flags are automated checks, not findings of wrongdoing.",
  },

  "Nigerian Pidgin": {
    labels: { critical: "Critical", warning: "Warning", review: "Review" },
    none: "No polling unit get flag. Result sheets match IReV and no rule trigger.",
    summary: (n, f) => `Summary: dem check ${n} polling units, ${f} get flag wey need verification.`,
    flags: {
      accredited_exceeds_registered: d => `Accredited voters (${d.accredited}) pass registered voters (${d.registered}).`,
      over_voting: d => `Over-voting: ${d.cast} votes dey, but na only ${d.accredited} voters dem accredit.`,
      missing_irev: () => "No IReV upload dey. Electoral Act 2026 talk say dem must send polling-unit results electronically.",
      irev_mismatch: d => `Party ${d.party}: result sheet show ${d.paper}, IReV show ${d.irev} (${d.diff}).`,
      high_turnout: d => `Turnout of ${d.turnout} high pass normal.`,
      turnout_outlier: d => `Turnout of ${d.turnout} far from the ${d.median} wey normal for this area.`,
      one_sided: d => `One party get ${d.share} of valid votes. Make una confirm am with the result sheet.`,
      zero_accredited: () => "Zero voters accredited. Check whether voting happen or dem cancel the unit.",
    },
    next: "Wetin observers suppose do next:\n1. Compare the paper Form EC8A for each flagged unit with im IReV upload.\n" +
      "2. Ask party agents and observers wey dey that unit wetin dem write down.\n" +
      "3. Report any confirmed problem to INEC through official channels.\n" +
      "These flags na automatic checks. Dem no be proof say person do wrong.",
  },

  "Hausa": {
    labels: { critical: "Mai tsanani", warning: "Gargaɗi", review: "A duba" },
    none: "Babu rumfar zaɓe da aka yi wa alama. Takardun sakamako sun yi daidai da IReV, kuma babu wata ƙa'ida da ta tashi.",
    summary: (n, f) => `Taƙaitawa: an duba rumfunan zaɓe ${n}, an yi wa ${f} alama don tantancewa.`,
    flags: {
      accredited_exceeds_registered: d => `Masu zaɓe da aka tantance (${d.accredited}) sun fi masu rajista (${d.registered}).`,
      over_voting: d => `Ƙuri'u fiye da kima: an kaɗa ƙuri'u ${d.cast}, amma masu zaɓe ${d.accredited} kawai aka tantance.`,
      missing_irev: () => "Ba a sami sakamakon da aka ɗora a IReV ba. Dokar Zaɓe ta 2026 (Electoral Act 2026) ta buƙaci a tura sakamakon rumfa ta hanyar lantarki.",
      irev_mismatch: d => `Jam'iyya ${d.party}: takardar sakamako ta nuna ${d.paper}, IReV ya nuna ${d.irev} (${d.diff}).`,
      high_turnout: d => `Fitowar masu zaɓe ta ${d.turnout} ta yi yawa fiye da yadda aka saba.`,
      turnout_outlier: d => `Fitowar masu zaɓe ta ${d.turnout} ta yi nisa da ta yankin da aka saba, wato ${d.median}.`,
      one_sided: d => `Jam'iyya ɗaya ta sami ${d.share} na ƙuri'u masu inganci. Ya dace a tabbatar da takardar sakamako.`,
      zero_accredited: () => "Ba a tantance ko mai zaɓe ɗaya ba. A duba ko an yi zaɓe ko an soke rumfar.",
    },
    next: "Matakai na gaba ga masu sa ido:\n1. A kwatanta ainihin Form EC8A na kowace rumfar da aka yi wa alama da abin da aka ɗora a IReV.\n" +
      "2. A tambayi wakilan jam'iyyu da masu sa ido da ke wurin abin da suka rubuta.\n" +
      "3. A kai rahoton matsalolin da aka tabbatar ga INEC ta hanyoyin hukuma.\n" +
      "Waɗannan alamomi binciken na'ura ne, ba shaidar aikata laifi ba ne.",
  },

  "Yoruba": {
    labels: { critical: "Pàtàkì gan-an", warning: "Ìkìlọ̀", review: "Àyẹ̀wò" },
    none: "Kò sí ibùdó ìdìbò kankan tí a sàmì sí. Ìwé èsì bá IReV mu, kò sì sí òfin kankan tí ó kàn.",
    summary: (n, f) => `Àkópọ̀: a ṣàyẹ̀wò ibùdó ìdìbò ${n}, a sì sàmì sí ${f} fún ìjẹ́rìísí.`,
    flags: {
      accredited_exceeds_registered: d => `Àwọn olùdìbò tí a fọwọ́ sí (${d.accredited}) ju àwọn tí ó forúkọ sílẹ̀ (${d.registered}) lọ.`,
      over_voting: d => `Ìbò àṣejù: ìbò ${d.cast} ni a dì, ṣùgbọ́n olùdìbò ${d.accredited} péré ni a fọwọ́ sí.`,
      missing_irev: () => "A kò rí èsì tí a gbé sí IReV. Òfin Ìdìbò 2026 (Electoral Act 2026) ní kí a fi èsì ibùdó ìdìbò ránṣẹ́ lórí ayélujára.",
      irev_mismatch: d => `Ẹgbẹ́ ${d.party}: ìwé èsì fi ${d.paper} hàn, IReV fi ${d.irev} hàn (${d.diff}).`,
      high_turnout: d => `Ìpín àwọn tó jáde dìbò, ${d.turnout}, ga ju bí ó ti máa ń rí lọ.`,
      turnout_outlier: d => `Ìpín àwọn tó jáde dìbò, ${d.turnout}, jìnnà sí ${d.median} tí ó wọ́pọ̀ ní agbègbè náà.`,
      one_sided: d => `Ẹgbẹ́ kan gba ${d.share} nínú àwọn ìbò tó wúlò. Ó yẹ kí a fi ìwé èsì ṣàyẹ̀wò rẹ̀.`,
      zero_accredited: () => "Kò sí olùdìbò kankan tí a fọwọ́ sí. Ṣàyẹ̀wò bóyá ìdìbò wáyé tàbí wọ́n fagi lé ibùdó náà.",
    },
    next: "Ìgbésẹ̀ tó kàn fún àwọn alábòójútó:\n1. Fi Form EC8A gidi ti ibùdó kọ̀ọ̀kan tí a sàmì sí wé èyí tí a gbé sí IReV.\n" +
      "2. Béèrè lọ́wọ́ àwọn aṣojú ẹgbẹ́ òṣèlú àti àwọn alábòójútó tí ó wà níbẹ̀ ohun tí wọ́n kọ sílẹ̀.\n" +
      "3. Fi àwọn ìṣòro tí a ti fìdí rẹ̀ múlẹ̀ tó INEC létí nípasẹ̀ àwọn ọ̀nà ìjọba.\n" +
      "Àyẹ̀wò aládàáṣe ni àwọn àmì wọ̀nyí, wọn kì í ṣe ẹ̀rí ìwà àìtọ́.",
  },

  "Igbo": {
    labels: { critical: "Dị oke mkpa", warning: "Ịdọ aka ná ntị", review: "Nyochaa" },
    none: "Ọ dịghị ebe ntuli aka a kara akara. Akwụkwọ nsonaazụ dakọrọ na IReV, ọ dịghịkwa iwu ọ bụla metụtara ya.",
    summary: (n, f) => `Nchịkọta: e lere ebe ntuli aka ${n}, a kara ${f} akara maka nyocha.`,
    flags: {
      accredited_exceeds_registered: d => `Ndị ntuli aka a nabatara (${d.accredited}) karịrị ndị debanyere aha (${d.registered}).`,
      over_voting: d => `Vootu karịrị akarị: a tụrụ vootu ${d.cast}, mana ọ bụ naanị ndị ntuli aka ${d.accredited} ka a nabatara.`,
      missing_irev: () => "Achọtaghị nsonaazụ e bulitere na IReV. Iwu Ntuli Aka nke 2026 (Electoral Act 2026) chọrọ ka e ziga nsonaazụ ebe ntuli aka site n'ịntanetị.",
      irev_mismatch: d => `Pati ${d.party}: akwụkwọ nsonaazụ gosiri ${d.paper}, IReV gosiri ${d.irev} (${d.diff}).`,
      high_turnout: d => `Ọnụ ọgụgụ ndị bịara ịtụ vootu, ${d.turnout}, dị elu karịa ka ọ na-adịkarị.`,
      turnout_outlier: d => `Ọnụ ọgụgụ ndị bịara ịtụ vootu, ${d.turnout}, dị anya na ${d.median} a na-ahụkarị n'ógbè ahụ.`,
      one_sided: d => `Otu pati nwetara ${d.share} n'ime vootu ziri ezi. Ọ dị mma ka e jiri akwụkwọ nsonaazụ kwado ya.`,
      zero_accredited: () => "Ọ dịghị onye ntuli aka a nabatara. Lelee ma ntuli aka ọ mere ma ọ bụ ma a kagburu ebe ahụ.",
    },
    next: "Ihe ndị nlekọta ga-eme ọzọ:\n1. Tụnyere Form EC8A n'akwụkwọ nke ebe ọ bụla a kara akara na nke e bulitere na IReV.\n" +
      "2. Jụọ ndị nnọchiteanya pati na ndị nlekọta nọ n'ebe ahụ ihe ha dere.\n" +
      "3. Kọọrọ INEC nsogbu ọ bụla e kwadoro site n'ụzọ gọọmentị.\n" +
      "Akara ndị a bụ nyocha akpaka. Ha abụghị ihe akaebe na e mere ihe ọjọọ.",
  },
};
