# Архитектура «Мой дом» v2

Главное правило: **ID дома — единственный ключ связи**.

```text
Building
 ├── BuildingProfile
 ├── Meter[]
 ├── BuildingEvent[]
 ├── Request[]
 ├── Repair[]
 └── ResidentBuilding[]
```

Frontend получает `House` в таком же агрегированном виде. Никакой экран не
определяет дом по порядку массива, тексту адреса или запасному `houses[0]`.

Общее состояние дома — производное значение. Его вычисляют:

- backend: `backend/app/services/building_state.py`
- frontend fallback: `frontend/src/domain/houseState.ts`

Статус не хранится вручную, поэтому не может остаться «Всё в порядке» при
активном отключении воды или необходимости передать показания.

Для чистого запуска старой копии проекта можно один раз выполнить
`RESET_DATABASE.ps1`, затем `START.ps1`.
