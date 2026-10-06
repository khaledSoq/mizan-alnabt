# أرشيف القوافي

صفحة القوافي في `docs/qawafi/` تقرأ بياناتها من `docs/qawafi/data/`، وهذه البيانات **لا تُرفع للمستودع**: تُبنى في GitHub Actions عند النشر (`.github/workflows/pages.yml`) وتُحفظ في الذاكرة المؤقتة، ولا يُعاد بناؤها إلا إذا تغيّر كود هذا المجلد أو المحرك.

## النشر

- مصدر Pages في إعدادات المستودع يجب أن يكون **GitHub Actions** (Settings ثم Pages ثم Source). بدونه يفشل `configure-pages` برسالة "Get Pages site failed: Not Found".
- أول نشر بعد أي تعديل في هذا المجلد أو في `engine/` يبني البيانات من جديد (نحو ١٠ دقائق)، وما بعده دقيقة.

## خط البناء

| الخطوة | الملف | المدة التقريبية |
|---|---|---|
| تنزيل Ashaar (نسخة مثبّتة `ASHAAR_REV`) واستخراج القوافي | `build_qawafi.py --download` | ٩ دقائق |
| عمود الوزن بمحرك الميزان | `wazn.py --mizan ../..` | دقيقة |
| حارس الجودة: مراجعة الخمسين | `test_wazn.py --min 44` | ثوانٍ |
| بيانات الصفحة | `make_web.py` | دقيقة |
| فهرس مفردات الأشعار لصفحة المرادفات | `build_vocab.py` | دقيقتان |

`test_wazn.py` يقيس الوزن على مراجعة خالد اليدوية (`wazn_gold_50.json`)، ويُفشل النشر إن نزلت النتيجة عن الحد. ارفع الحد كلما تحسّن المحرك.

## التشغيل محليًا

```bash
cd tools/qawafi
pip install pyarrow
python build_qawafi.py --download --data data --out out
python wazn.py --mizan ../.. --rhymes out/rhymes.csv
python test_wazn.py --mizan ../.. --rhymes out/rhymes.csv
python make_web.py --rhymes out/rhymes.csv --verses out/verses.jsonl.gz --out ../../docs/qawafi/data
python build_vocab.py --verses out/verses.jsonl.gz --out ../../docs/qawafi/data
```

## قرارات مطبّقة في البيانات

- النبطي داخل لـ١٧٢ شاعرًا سعوديًا وخليجيًا معاصرًا (`nabati_poets.json`: الدولة من بوابة الشعراء وموسوعة أبوظبي، أو اللهجة حين لا دولة). وبقية العامي مستبعدة، وأغلبها مصري.
- الصدر والعجز معاملة واحدة.
- الشاهد القديم يُنشر نصه، والحديث وغير محدد العصر رابط المصدر فقط.
- التشكيل في المدونة فصيح والميزان نجدي، فالتشكيل يحسم التعادل فقط ولا ينقض قراءة المحرك.

## المعاني

تأتي من سوار عبر الوسيط `worker/siwar-proxy.js` (Cloudflare Worker). المفتاح سرّ في إعدادات Cloudflare، ولا يوجد في هذا المستودع.

المصادر: مجموعة أشعار (Ashaar) للبحث والتطوير، ومنصة سوار من مجمع الملك سلمان العالمي للغة العربية.
