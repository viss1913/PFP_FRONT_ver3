# BankFuture — готовые промпты (copy-paste)

**7 файлов** — без дублей по полу. Кидай в `public/landing/` как **WebP** (85–90%).

**Референс стиля:** тёмно-изумрудный + чёрный мрамор + золото/латунь, luxury family office, киношный свет, вид из окна. Люди только в аватарках отзывов.

| Файл | Размер | Где на сайте |
|------|--------|--------------|
| `stats-illustration.webp` | 4:3 · 1200×900 | Блок статистики |
| `hero.webp` | 4:5 · 960×1200 | Hero справа |
| `education.webp` | 16:9 · 1280×720 | Постер видео |
| `avatar-1.webp` … `avatar-3.webp` | 1:1 · 512×512 | Отзывы (3 шт.) |
| `og-image.webp` | 1200×630 | Соцсети (опционально) |

> **variant m/f** в URL — только для **текста** лендинга, картинки одни на всех.

---

## `stats-illustration.webp` · 4:3 · 1200×900

```
Dark luxury family office still life, photorealistic cinematic 3D render. Deep emerald green velvet curtains and black marble desk with white veins. Center: brushed gold cylindrical bars of different heights on a marble plinth forming an abstract rising bar chart. Antique desk globe with gold continents and dark green oceans on brass stand. Dark green leather-bound planner with gold pen. Soft warm window light from the right revealing misty mountain valley and river at golden hour, shallow depth of field, bokeh background. Mood: multi-generational wealth, stability, global family office. Rich contrast, no people, no screens with readable UI. Aspect ratio 4:3, ultra detailed, 8k quality.

Negative prompt: text, letters, numbers, watermark, logo, brand name, readable chart labels, stock ticker, bitcoin, crypto coins, neon colors, clipart, cartoon, flat illustration, oversaturated, low resolution, blurry, jpeg artifacts, messy clutter, smiling faces, hands, corporate open-plan office, cheap plastic, bright white background
```

---

## `hero.webp` · 4:5 · 960×1200

```
Dark luxury family office still life, photorealistic cinematic 3D render, same visual world as premium wealth desk scene. Deep emerald velvet, black marble with gold veins, brushed gold accents. Composition tuned for vertical hero: globe, gold bar-chart cylinders, leather planner, pen, soft golden-hour light from tall window with blurred mountain valley. More negative space on left third for website headline overlay. No people, no readable text on objects. Vertical 4:5 frame, shallow depth of field, warm premium mood.

Negative prompt: text, letters, numbers, watermark, logo, brand name, people, faces, hands, bitcoin, neon, clipart, cartoon, low resolution, blurry, messy clutter, cheap office, bright white background, stock photo watermark
```

---

## `education.webp` · 16:9 · 1280×720

```
Cinematic abstract video thumbnail, photorealistic 3D render, BankFuture luxury family office style: deep emerald green, black marble, brushed gold accents. Center: soft golden light orb (no UI play button shape). Floating minimal gold line symbols: open book, shield, family tree, rising chart curve. Optional blurred marble desk edge in foreground. Wide 16:9, empty zone center-left for title overlay. No people, no readable text.

Negative prompt: text, letters, numbers, watermark, logo, YouTube UI, play button icon, faces, presenter, classroom, whiteboard with writing, bitcoin, neon, clipart, low resolution, blurry, cheap webinar thumbnail
```

---

## `avatar-1.webp` · 1:1 · 512×512

```
Professional headshot portrait, photorealistic. Person about 45, friendly calm neutral smile, smart casual (dark green or navy top). Soft blurred sage and emerald background. Even soft window light, sharp eyes, natural skin. Square 1:1, face centered for circular crop, premium understated look.

Negative prompt: text, watermark, logo, sunglasses, hat, exaggerated smile, busy background, low resolution, blurry, distorted face, extra fingers, cartoon, group photo
```

---

## `avatar-2.webp` · 1:1 · 512×512

```
Professional headshot portrait, photorealistic. Person about 38, financial advisor energy, optional thin glasses, neat hair, grey blazer over dark shirt, approachable confident expression. Soft green-grey blurred background. Square 1:1, centered for circular crop.

Negative prompt: text, watermark, logo, salesman smirk, pointing gesture, busy office, low resolution, blurry, distorted face, extra fingers, cartoon, group photo
```

---

## `avatar-3.webp` · 1:1 · 512×512

```
Professional headshot portrait, photorealistic. Person about 50, dignified warm smile, elegant dark emerald top, family principal energy. Soft blurred green background, cinematic soft light. Square 1:1, centered for circular crop.

Negative prompt: text, watermark, logo, busy background, low resolution, blurry, distorted face, extra fingers, cartoon, group photo
```

---

## `og-image.webp` · 1200×630 (optional)

```
Wide cinematic banner, BankFuture luxury family office aesthetic. Left two-thirds: deep emerald gradient, black marble texture, abstract gold rising chart line and thin shield outline, generous clean negative space for future title overlay. Right third: soft premium office window with blurred golden-hour mountain view, gold desk accents. Photorealistic 3D render, 1.91:1, no baked-in text.

Negative prompt: text, letters, numbers, watermark, logo, brand name, social media icons, faces, people, bitcoin, neon, clipart, low resolution, blurry, crowded composition
```

---

## Не генерить AI

`public/landing/partners/` — только официальные логотипы.

---

## После генерации

Скинь `.webp` — подключу пути в `landingVisualAssets` и проверю лендинг.
