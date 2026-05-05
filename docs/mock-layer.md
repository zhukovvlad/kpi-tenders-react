# Работа с mock-слоем

Большинство backend-эндпоинтов ещё не реализованы, поэтому фронтенд работает с детерминированными mock-данными. Этот документ объясняет, как mock-слой устроен и как его менять.

---

## Структура

```
src/services/
├── mocks/
│   ├── index.ts     — флаг USE_MOCKS + helpers mockDelay / mockReject
│   └── data.ts      — seed-данные: объекты, документы, ключи, запросы, события
└── api/
    ├── sites.ts     — каждый метод ветвится: mock vs real
    ├── documents.ts
    ├── extraction.ts
    └── ...
```

---

## Как включается

**`src/services/mocks/index.ts`:**
```ts
export const USE_MOCKS =
  import.meta.env.PROD === false &&
  import.meta.env.VITE_USE_MOCKS !== "false"
```

| Среда | Значение |
|-------|----------|
| `npm run dev` (без настроек) | `true` — моки включены |
| `npm run dev` + `VITE_USE_MOCKS=false` | `false` — реальный API |
| `npm run build` / prod | всегда `false` |

---

## Переключение на реальный бэкенд в dev

Создайте файл `.env.local` в корне проекта:

```
VITE_USE_MOCKS=false
VITE_API_URL=http://localhost:8080
```

Vite подхватывает изменение без перезапуска. Чтобы вернуть моки — удалите файл или поставьте `VITE_USE_MOCKS=true`.

> `.env.local` в `.gitignore` — не коммитится.

---

## Seed-данные

Файл `src/services/mocks/data.ts` содержит:

| Константа / функция | Что хранит |
|---|---|
| `MOCK_USER` | Авторизованный пользователь (admin) |
| `MOCK_SITES` | 8 объектов строительства с иерархией |
| `getMockSiteList()` | Динамический список `SiteListItem[]` — читает `MOCK_SITES` при каждом вызове, отражает CRUD-мутации |
| `MOCK_SITE_LIST` | **Устаревшая статическая копия** — не использовать в новом коде |
| `MOCK_DOCUMENTS` | 9 документов с bundle-структурой (договор + смета + ТЗ) |
| `MOCK_KEYS` | 10 ключей (8 системных + 2 тенантных) |
| `MOCK_EXTRACTED_DATA` | ~30 извлечённых значений |
| `MOCK_REQUESTS` | 3 запроса извлечения |
| `MOCK_COMPARISONS` | 2 сохранённые сессии сравнения |
| `MOCK_EVENTS` | 8 событий объекта |

### Иерархия объектов

```
ЖК Сити Бей (0001)         ← корень, parent_id = null
├── 6-я очередь (0002)
│   └── Корпус 5 (0003)
└── 8-я очередь (0004)
ЖК Северный (0005)          ← корень
└── Очередь 2 (0006)
БЦ Парк Сухаревский (0007)  ← корень, completed
Логопарк Север-2 (0008)     ← корень, archived
```

Дашборд показывает только корни (`parent_id === null`). Дочерние открываются через drill-down.

### Добавить объект в seed

```ts
// data.ts → SITE_SEEDS
{
  id: id("0009"),
  parent_id: id("0005"),  // дочерний к ЖК Северный
  name: "Очередь 3",
  status: "active",
  cover: null,
  created_days_ago: 10,
  inflation_pct: null,
  aggregate_status: "empty",
},
```

Все ID — строки вида `00000000-0000-0000-0000-000000000001`. Функция `id("0009")` добавит нужные нули автоматически.

---

## Как устроен mock в API-сервисе

Каждый метод в `src/services/api/*.ts` выглядит так:

```ts
list: (): Promise<SiteListItem[]> =>
  USE_MOCKS
    ? mockDelay(getMockSiteList().filter((s) => s.parent_id === null))
    : apiClient
        .get<SiteListItem[]>("/api/v1/sites?aggregate=true&roots=true")
        .then((r) => r.data),
```

`mockDelay(value, ms = 220)` — возвращает промис с задержкой, имитируя сетевой round-trip. Без задержки loading-состояния пропадают мгновенно и ошибки пропустить легче.

`mockReject(message)` — промис, который режектится с `Error`. Используйте для тестирования error-состояний:

```ts
get: (siteId: string) =>
  USE_MOCKS
    ? mockReject("Объект не найден")   // ← принудительная ошибка
    : apiClient.get(...)
```

---

## Добавить новый endpoint

1. Объявите тип в `src/types/`.
2. Добавьте seed в `data.ts`.
3. Создайте файл `src/services/api/newThing.ts`:

```ts
import apiClient from "./client"
import type { Thing } from "@/types/thing"
import { mockDelay, USE_MOCKS } from "@/services/mocks"
import { MOCK_THINGS } from "@/services/mocks/data"

export const thingsApi = {
  list: (): Promise<Thing[]> =>
    USE_MOCKS
      ? mockDelay([...MOCK_THINGS])
      : apiClient.get<Thing[]>("/api/v1/things").then((r) => r.data),

  get: (id: string): Promise<Thing> =>
    USE_MOCKS
      ? mockDelay(MOCK_THINGS.find((t) => t.id === id)!)
      : apiClient.get<Thing>(`/api/v1/things/${id}`).then((r) => r.data),
}
```

---

## Переход на реальный бэкенд

Переключайте **по одному сервису**, не всё сразу.

### Чеклист для каждого endpoint

- [ ] Сравнить поля TypeScript-интерфейса с реальным JSON-ответом
- [ ] При расхождении — исправить тип или добавить маппер в `.then()`
- [ ] Выставить `VITE_USE_MOCKS=false`, проверить в браузере
- [ ] Убедиться, что error-состояния (`isError`) корректно обрабатываются
- [ ] Удалить mock-ветку из метода

### Когда все методы переведены

1. Удалить `src/services/mocks/` целиком
2. Убрать все импорты `USE_MOCKS`, `mockDelay`, `mockReject` из `src/services/api/`
3. Удалить переменную `VITE_USE_MOCKS` из `.env*` и `vite.config.ts`
4. Проверить `npm run typecheck` — не должно быть ошибок

---

## Auth в mock-режиме

`authApi.fetchMe()` читает `localStorage["mock-auth-session"]`. Значение записывается при логине и удаляется при логауте. TTL нет — сессия живёт, пока пользователь не нажмёт «Выйти» или не очистит localStorage.

Это намеренно: имитирует HTTP-only cookie, у которой TTL задаётся бэкендом (`max-age`).

Принудительно сбросить сессию в dev: `localStorage.removeItem("mock-auth-session")` в консоли браузера, затем обновить страницу.

---

## Важные ограничения

**`MOCK_SITE_LIST` vs `getMockSiteList()`**

`MOCK_SITE_LIST` вычисляется один раз при загрузке модуля. После CRUD-мутаций (`create`/`update`/`delete`) он не обновляется. Используйте `getMockSiteList()` везде, где нужен актуальный список.

**blob: URL для обложки**

`SitesNewPage` хранит preview обложки как `URL.createObjectURL()` и передаёт его как `cover_image_path`. В mock это работает. В реальном режиме потребуется upload-endpoint для файлов — исправляется при появлении `POST /api/v1/upload`.

**Параллельные запросы**

В mock-режиме несколько одновременных запросов работают независимо — мутации в одном не влияют на кэш другого до следующего `queryClient.invalidateQueries`. Поведение идентично реальному API.
