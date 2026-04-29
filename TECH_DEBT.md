# Tech Debt

Отслеживание известных технических долгов. Статусы: `open` · `in-progress` · `resolved`.

---

## [TD-001] N+1 запросов задач на странице анонимизации · `resolved`

**Файл:** `src/pages/AnonymizationPage.tsx`  
**Контекст:** `DocumentAnonymizationRow` создавал отдельный `useQuery` + polling-цикл на 3 с для каждой строки документа. При большом числе строк это генерировало значительный фоновый трафик.

**Решение (2026-04-29):**  
- Бекенд (`go-kpi-tenders`): добавлен `GET /api/v1/tasks?document_ids=id1,id2,...` — SQL `WHERE document_id = ANY($1::uuid[])`, tenancy-safe.  
- Фронтенд: `useQuery` вынесен из `DocumentAnonymizationRow` в `AnonymizationPage`. Один батч-запрос на страницу с polling, который останавливается автоматически когда все задачи завершены. Строки получают `tasks` и `isLoadingTasks` через props.  
- Добавлен `tasksApi.getByDocuments(ids[])` в `src/services/api/tasks.ts`.

---

## [TD-002] Тесты не настроены · `open`

**Файл:** `package.json`, `vite.config.ts`  
**Контекст:** Vitest + `@testing-library/react` не установлены. Покрытия нет.

**Желаемое решение:**
```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```
Приоритет покрытия (из `CLAUDE.md`):
1. Axios interceptor (401 → logout, 403/5xx → toast)
2. Валидация форм (login, register)
3. Role-based rendering (`admin`-only компоненты)
4. TanStack Query хуки (mock via `msw` или `vi.fn`)

---

## [TD-003] Незарегистрированные роуты · `open`

**Файл:** `src/App.tsx`  
**Контекст:** Следующие страницы запланированы, но не добавлены в `<Routes>`:

| Роут | Статус |
|------|--------|
| `/login` | не зарегистрирован |
| `/register` | не зарегистрирован |
| `/sites` | не реализован |
| `/sites/:id` | не реализован |
| `/users` | не реализован |
| `/profile` | не реализован |

Сейчас используются модальные окна `LoginModal` / `RegisterModal` вместо отдельных страниц.
