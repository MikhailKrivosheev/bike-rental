# Handoff: MVP аренды велосипедов

## Overview
Веб-MVP почасовой аренды велосипедов: главная с каталогом карточек, бронирование прямо с карточки через модальное окно, страница отдельного велосипеда с характеристиками и панелью брони. Есть общий хедер и футер.

## About the Design Files
Файл `bike-rental.dc.html` — **дизайн-референс в HTML**: прототип, показывающий задуманный вид и поведение, а не production-код для копирования. Задача — **воссоздать этот дизайн в вашем окружении** (React/Next.js + Tailwind + shadcn/ui, Vue и т.д.), используя существующие паттерны проекта. Если окружения ещё нет — Next.js + Tailwind + shadcn/ui даст самое близкое соответствие: дизайн намеренно построен на визуальном языке shadcn.

Как читать прототип: единый компонент с шаблоном и классом логики, стили инлайновые. `<sc-for list="..." as="x">` = `.map()`, `<sc-if value="...">` = условный рендер, `{{ path }}` = значение из `renderVals()`. Данные шести велосипедов лежат в константе `BIKES` — можно забрать как моки.

## Fidelity
**High-fidelity.** Финальные цвета, типографика, отступы и состояния — воссоздавать точно, средствами вашей библиотеки компонентов (для shadcn/ui: Button, Card, Badge, Dialog, Select, Input).

## Screens / Views

### 1. Header (общий)
- Sticky top 0, z-index 30, фон `rgba(255,255,255,.85)` + `backdrop-filter: blur(8px)`, нижняя граница 1px `#e4e4e7`.
- Контейнер: max-width 1180px, padding 0 24px, height 64px, flex, gap 32px.
- Логотип: квадрат 28×28, radius 8, фон `#18181b`, буква «В» `#fafafa` 14px/600; рядом «Велопрокат» 15px/600, letter-spacing −.01em. Клик → главная.
- Nav 14px `#71717a`, gap 24, hover `#09090b`: Каталог, Как это работает, Точки выдачи.
- Справа: outline «Мои брони» (h36, padding 0 14, radius 8, border `#e4e4e7`, hover bg `#f4f4f5`) и primary «Войти» (bg `#18181b`, text `#fafafa`, hover `#27272a`).

### 2. Главная — hero
- max-width 1180px, padding 64px 24px 40px.
- Пилюля: h26, padding 0 10, radius 999, border `#e4e4e7`, bg `#fafafa`, 12px `#71717a`, точка 6×6 `#22c55e`. Текст: «18 велосипедов свободны сейчас».
- H1 44px/1.1, 600, letter-spacing −.03em, max-width 16ch: «Аренда велосипедов по часам».
- Подзаголовок 16px/1.6 `#71717a`, max-width 56ch: «Выберите велосипед, укажите время — заберите на ближайшей точке. Бронирование занимает меньше минуты, оплата после поездки.»

### 3. Главная — каталог
- Шапка секции: flex space-between, padding-bottom 20, нижняя граница 1px `#e4e4e7`. H2 20px/600 «Каталог» + строка 14px `#71717a`: «N велосипедов · оплата после поездки» (русское склонение числительных).
- Фильтры: h34, padding 0 14, radius 8, 13px/500. Активный — bg `#18181b` / text `#fafafa`; остальные — белый фон, border `#e4e4e7`. Значения: Все, Городской, Электро, Горный, Складной.
- Сетка: `repeat(auto-fill, minmax(320px, 1fr))`, gap 20, padding 28px 0 72px.

#### Карточка
- border 1px `#e4e4e7`, radius 14, overflow hidden, cursor pointer. Hover: `box-shadow: 0 8px 24px -12px rgba(9,9,11,.18)`, border `#d4d4d8`, transition .15s ease.
- Медиа: aspect 4/3, плейсхолдер `repeating-linear-gradient(135deg,#f4f4f5 0 10px,#ededf0 10px 20px)`, нижняя граница. **Заменить на фото.** Подпись — Geist Mono 11px uppercase `#a1a1aa`.
- Бейдж типа: top/left 12, h24, radius 999, bg white, border `#e4e4e7`, 12px/500.
- Бейдж доступности: top/right 12. Свободен — белый с границей; занят — bg `#18181b`, text `#fafafa`, «Занят до 18:00».
- Тело: padding 18, gap 10. Название 16px/600; рейтинг «★ 4.8» 13px `#71717a` (скрывается пропом showRatings). Описание 14px/1.55 `#71717a`, text-wrap pretty.
- Чипы: h22, padding 0 8, radius 6, bg `#f4f4f5`, text `#52525b`, 12px.
- Футер карточки: верхняя граница 1px `#f4f4f5`, padding-top 14. Цена 20px/600 (−.02em) + «/ час» 13px `#71717a`. Кнопка «Забронировать» h36 primary; занятый — bg `#f4f4f5`, text `#a1a1aa`, disabled, cursor not-allowed.
- Клик по карточке → детальная. Клик по кнопке → модалка (обязательно `stopPropagation`).

### 4. Страница велосипеда
- «← Все велосипеды»: outline h32, 13px, margin-bottom 24.
- Grid `minmax(0,1.55fr) minmax(320px,1fr)`, gap 40, align-items start.
- Слева: главное фото aspect 16/10 radius 14; три превью в grid 3 колонки (aspect 4/3, radius 10) — вид сбоку, руль, трансмиссия. Далее H1 32px/600 (−.025em), описание 16px/1.65 `#52525b` max-width 60ch, «Характеристики» 15px/600 и таблица: контейнер border 1px radius 12, строки flex space-between padding 12px 16px, 14px, ключ `#71717a`, значение 500, разделитель `#f4f4f5`.
- Справа (sticky top 96): border 1px radius 14, padding 22, gap 16. Цена 28px/600 + «/ час». Поля: datetime-local «Дата и время начала»; степпер длительности (кнопки 38×38 «−»/«+», поле «3 часа»); select точки выдачи. Итог: «180 ₽ × 3 часа» `#71717a` и сумма 16px/600. CTA «Забронировать» h42 radius 9. Подпись 12px `#a1a1aa`: «Бесплатная отмена за 2 часа до начала».

### 5. Модалка брони
- Overlay `rgba(9,9,11,.45)`, fade .12s. Панель max-width 420, radius 14, border 1px, padding 24, gap 16, shadow `0 24px 60px -20px rgba(9,9,11,.35)`, появление: opacity 0→1 + `translateY(8px) scale(.98)`→none, .16s ease.
- Заголовок 17px/600 — название велосипеда; подзаголовок 14px `#71717a` «Выберите время и точку выдачи».
- Те же три контрола. Итоговая плашка bg `#f4f4f5`, radius 10, padding 12px 14px.
- Кнопки справа: «Отмена» (outline), «Подтвердить» (primary), gap 10.
- Успех: «Бронь подтверждена» / «Мы отправили детали в Telegram», плашка с деталями брони, кнопка «Готово».

### 6. Footer
- Верхняя граница 1px `#e4e4e7`, bg `#fafafa`. Grid `1.4fr 1fr 1fr 1fr`, gap 32, padding 44px 24px.
- Первая колонка: лого 24×24 + название + текст 13px/1.6 `#71717a` max-width 34ch.
- Колонки ссылок: заголовок 13px/600, ссылки 13px `#71717a`, gap 10 (Точки выдачи / Сервис / Поддержка).
- Нижняя полоса: padding 16px 24px, 12px `#a1a1aa`: «© 2026 Велопрокат» и «Договор оферты · Политика конфиденциальности».

## Interactions & Behavior
- Клик по карточке → detail, `window.scrollTo(0,0)`.
- «Забронировать» на карточке → модалка этого велосипеда, всплытие остановлено.
- Фильтр по типу — клиентская фильтрация.
- Степпер часов: 1…24.
- «Подтвердить» / CTA в панели → состояние успеха.
- Overlay, «Отмена», «Готово» → закрытие.
- Hover: outline → bg `#f4f4f5`; primary → `#27272a`; карточка → тень + `#d4d4d8`.
- Занятые: кнопка disabled, карточка открывается.
- Не реализовано (нужен бэкенд): авторизация, «Мои брони», реальная доступность по времени, оплата.

## State Management
`view: 'home' | 'bike'`, `selectedId`, `filter`, `dialogId` (null = закрыта), `hours` (default 3), `start` (строка datetime-local), `point`, `booked`.
Ожидаемое API: `GET /bikes` (цена, тип, доступность), `GET /bikes/:id`, `POST /bookings` { bikeId, start, hours, point }.

## Design Tokens (shadcn zinc, light)
- background `#ffffff`; muted/secondary `#f4f4f5`; border `#e4e4e7`; border hover `#d4d4d8`
- foreground `#09090b`; secondary text `#52525b`; muted text `#71717a`; placeholder `#a1a1aa`
- primary `#18181b`, hover `#27272a`, primary-foreground `#fafafa`; success dot `#22c55e`
- Radius: 6 / 8 / 9 / 10 / 14 / 999
- Spacing: 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 32, 40, 44, 64, 72
- Шрифты: Geist (400/500/600/700) + Geist Mono для подписей-плейсхолдеров. Шкала: 44 / 32 / 28 / 20 / 17 / 16 / 15 / 14 / 13 / 12 / 11. Letter-spacing: −.03em, −.025em, −.02em, −.01em.
- Тени: карточка hover `0 8px 24px -12px rgba(9,9,11,.18)`; модалка `0 24px 60px -20px rgba(9,9,11,.35)`
- Высоты контролов: 32 / 34 / 36 / 38 / 42

## Assets
Фотографий нет — полосатые плейсхолдеры с монопространственной подписью. Нужны: карточка 4:3, главное фото 16:10, три превью 4:3. Иконок нет: «★», «−», «+», «←» — текстовые символы; при желании заменить на lucide-react (Star, Minus, Plus, ArrowLeft).

## Screenshots
Скриншоты прототипа в `screenshots/` (порядок соответствует разделу «Screens / Views»):
- `01-home.png` — хедер и hero главной
- `02-catalog.png` — сетка карточек каталога
- `03-booking-dialog.png` — модалка бронирования с карточки
- `04-bike-detail.png` — страница велосипеда с панелью брони
- `05-footer.png` — таблица характеристик и футер

## Files
- `bike-rental.dc.html` — весь дизайн (главная, детальная, модалка, хедер, футер) и данные шести велосипедов в `BIKES`. Открывается в браузере напрямую.
