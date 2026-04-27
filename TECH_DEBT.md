# Tech Debt

Отслеживание известных технических долгов. Статусы: `open` · `in-progress` · `resolved`.

---

## [TD-001] N+1 запросов задач на странице анонимизации · `open`

**Файл:** `src/pages/AnonymizationPage.tsx`  
**Контекст:** `DocumentAnonymizationRow` создаёт отдельный `useQuery` + polling-цикл на 3 с для каждой строки документа. При большом числе строк это генерирует значительный фоновый трафик.

**Желаемое решение:**  
- Добавить на бекенде эндпойнт `GET /api/v1/tasks?document_ids=id1,id2,...` (батч-запрос).  
- Перенести polling на уровень страницы: один запрос для всех видимых документов.  
- Альтернатива — ограничить polling только видимыми строками через `IntersectionObserver`.

**Текущий workaround:** нет, N+1 активен.

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
