# TODO: стабільні коди помилок API

Статус: заплановано. Зараз фронтенд розпізнає помилки streak за точним англійським
текстом `message`. Зміна формулювання на бекенді може зламати відповідність перекладу.

## Запропонований контракт

```json
{
  "statusCode": 400,
  "code": "STREAK_NO_FREEZE_TOKENS",
  "message": "No freeze tokens available."
}
```

- `code` — стабільний машинний ідентифікатор, за яким фронтенд визначає повідомлення.
- `message` — пояснення для діагностики; клієнт не використовує його для розгалуження логіки.
- `statusCode` — відповідає HTTP-статусу. Під час цієї міграції зберегти поточні статуси.
- `details` — необов'язкові структуровані дані, наприклад `requiredCoins` та `availableCoins`.
  Додавати лише поля, потрібні клієнту; переклад і форматування залишаються на фронтенді.

## Коди streak для погодження

| Код бекенду                         | Ключ перекладу фронтенду              |
| ----------------------------------- | ------------------------------------- |
| `STREAK_NOT_ENOUGH_COINS`           | `streak.errors.notEnoughCoins`        |
| `STREAK_FREEZE_TOKEN_LIMIT_REACHED` | `streak.errors.freezeLimitReached`    |
| `STREAK_FREEZE_DAY_LIMIT_REACHED`   | `streak.errors.freezeDayLimitReached` |
| `STREAK_NO_FREEZE_TOKENS`           | `streak.errors.noFreezeTokens`        |
| `STREAK_FREEZE_WINDOW_EXPIRED`      | `streak.errors.freezeWindowExpired`   |
| `STREAK_FREEZE_ONLY_MISSED_DAY`     | `streak.errors.freezeOnlyMissed`      |
| `STREAK_DAY_ALREADY_PROTECTED`      | `streak.errors.dayAlreadyProtected`   |

Обидва старі формулювання про прострочене вікно заморозки мають відповідати одному
коду `STREAK_FREEZE_WINDOW_EXPIRED`.

## Порядок переходу

- [ ] Погодити назви кодів і форму відповіді.
- [ ] На бекенді додати коди до доменних помилок у `backend/src/streak/streak.service.ts`.
      Перевірити, що обробка винятків зберігає `code`, `message` та HTTP-статус у відповіді.
- [ ] Додати серверні тести контракту для кожної доменної помилки.
- [ ] На фронтенді в `resolveStreakErrorMessage` додати мапу `code → translationKey`.
      Невідомий код має повертати `fallbackKey`.
- [ ] Спочатку розгорнути бекенд з додатковим полем `code`, зберігши старий `message`.
      На перехідний період новий фронтенд може читати стару мапу текстів лише за відсутності `code`.
- [ ] Перевірити тести відомих і невідомих кодів, некоректного JSON та сумісності версій.
- [ ] Коли підтримка старого формату більше не потрібна, прибрати мапу текстів і TODO в коді.
- [ ] Наступним кроком застосувати цей самий контракт до mascot:
      `MASCOT_NOT_ENOUGH_COINS` і `MASCOT_ITEM_NOT_OWNED`.

## Додаткові нотатки

Тут можна дописати посилання на задачу, погоджені назви кодів і рішення щодо сумісності.
