"""
Seed script for PUC Learning Platform
Run from backend/ directory:
  python db/seed.py
"""
import asyncio
import sys
import os

# Support running both as module (python -m backend.db.seed) and directly (python db/seed.py in /app)
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root not in sys.path:
    sys.path.insert(0, _root)

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

# Try package import first, fall back to direct import (inside container)
try:
    from backend.models import (
        Base, User, Course, Module, Lesson, Test, Question, Answer,
        Progress, Ticket, FaqArticle
    )
    from backend.config import settings
except ModuleNotFoundError:
    from models import (
        Base, User, Course, Module, Lesson, Test, Question, Answer,
        Progress, Ticket, FaqArticle
    )
    from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Idempotent: skip if already seeded
        from sqlalchemy import select
        result = await db.execute(select(User).limit(1))
        if result.scalar():
            print("Database already seeded, skipping.")
            return

        # ---- USERS ----
        users_data = [
            User(
                id=1, name="Смирнова Анна Сергеевна", email="user@mfc.ru",
                password_hash=pwd_context.hash("123456"), role="user",
                department="МФЦ Казань, окно №12"
            ),
            User(
                id=2, name="Кузнецов Дмитрий Александрович", email="mod@puc.ru",
                password_hash=pwd_context.hash("123456"), role="moderator",
                department="ООО ПУЦ, тех. отдел"
            ),
            User(
                id=3, name="Федоров Никита", email="admin@puc.ru",
                password_hash=pwd_context.hash("admin123"), role="admin",
                department="ООО ПУЦ, администрация"
            ),
        ]
        for u in users_data:
            existing = await db.get(User, u.id)
            if not existing:
                db.add(u)
        await db.commit()

        # ---- COURSES ----
        courses_data = [
            Course(id=1, title="РЕД ОС: Основы работы", category="os",
                   category_label="Операционные системы", color="#2563eb",
                   description="Базовый курс по работе с отечественной ОС РЕД ОС для сотрудников МФЦ."),
            Course(id=2, title="КриптоПро CSP: Электронная подпись", category="skzi",
                   category_label="СКЗИ", color="#7c3aed",
                   description="Курс по установке и использованию средств электронной подписи КриптоПро CSP и Рутокен."),
            Course(id=3, title="OnlyOffice: Работа с документами", category="office",
                   category_label="Офисное ПО", color="#059669",
                   description="Освоение офисного пакета OnlyOffice для работы с документами, таблицами и презентациями."),
            Course(id=4, title="Astra Linux: Безопасная работа", category="os",
                   category_label="Операционные системы", color="#dc2626",
                   description="Курс по работе с защищённой операционной системой Astra Linux для государственных учреждений."),
        ]
        for c in courses_data:
            existing = await db.get(Course, c.id)
            if not existing:
                db.add(c)
        await db.commit()

        # ---- MODULES ----
        modules_data = [
            Module(id=1, course_id=1, title="Введение в РЕД ОС", sort_order=1),
            Module(id=2, course_id=1, title="Настройка рабочего места", sort_order=2),
            Module(id=3, course_id=2, title="Установка и настройка", sort_order=1),
            Module(id=4, course_id=2, title="Работа с порталами", sort_order=2),
            Module(id=5, course_id=3, title="Текстовые документы", sort_order=1),
            Module(id=6, course_id=3, title="Таблицы и формулы", sort_order=2),
            Module(id=7, course_id=4, title="Основы Astra Linux", sort_order=1),
        ]
        for m in modules_data:
            existing = await db.get(Module, m.id)
            if not existing:
                db.add(m)
        await db.commit()

        # ---- LESSONS ----
        lessons_data = [
            Lesson(id=1, module_id=1, title="Знакомство с РЕД ОС", sort_order=1, content="""## Что такое РЕД ОС?

РЕД ОС — это отечественная операционная система на основе ядра **Linux**, разработанная компанией «РЕД СОФТ». Система включена в **Единый реестр российских программ** и соответствует требованиям импортозамещения.

### Ключевые особенности:
- Совместимость с российскими СКЗИ (КриптоПро, ViPNet)
- Поддержка государственных информационных систем
- Встроенные механизмы защиты информации
- Активная техническая поддержка производителя

### Рабочий стол
Интерфейс РЕД ОС основан на рабочем столе **MATE** или **KDE Plasma**. Несмотря на отличия от Windows, основные принципы работы схожи: панель задач, меню приложений, значки на рабочем столе.

### Запуск приложений
Для открытия программы нажмите кнопку **«Меню»** в левом нижнем углу и найдите нужное приложение в списке. Либо дважды кликните по значку на рабочем столе."""),

            Lesson(id=2, module_id=1, title="Файловая система Linux", sort_order=2, content="""## Файловая система в РЕД ОС

В Linux файловая система имеет **иерархическую структуру**, начиная с корневого каталога «/».

### Основные каталоги:
| Каталог | Назначение |
|---------|------------|
| /home | Домашние папки пользователей |
| /tmp | Временные файлы |
| /etc | Конфигурационные файлы |
| /var | Переменные данные (логи) |

### Работа с файлами
Файловый менеджер **Thunar** или **Dolphin** позволяет управлять файлами графически — так же как Проводник в Windows.

**Важно:** В Linux имена файлов **чувствительны к регистру**. «Документ.docx» и «документ.docx» — это разные файлы!

### Домашняя папка
Ваши личные файлы хранятся в папке **/home/имя_пользователя**. Это аналог папки «Мои документы» в Windows."""),

            Lesson(id=3, module_id=1, title="Работа с терминалом", sort_order=3, content="""## Терминал в РЕД ОС

Терминал — это текстовый интерфейс для ввода команд. Для сотрудников МФЦ базовые команды помогут решить типовые задачи.

### Открытие терминала
Меню → Системные → Терминал (или Ctrl+Alt+T)

### Основные команды:
```
ls          — показать содержимое папки
cd папка    — перейти в папку
pwd         — показать текущий путь
mkdir имя   — создать папку
cp файл1 файл2 — скопировать файл
```

### Запуск с правами администратора
Некоторые операции требуют прав администратора. Используйте команду **sudo** перед командой:
```
sudo команда
```
Система запросит пароль администратора.

### Установка принтера через терминал
```
sudo system-config-printer
```
Эта команда откроет графическое меню настройки принтеров."""),

            Lesson(id=4, module_id=2, title="Подключение периферийных устройств", sort_order=1, content="""## Подключение принтеров и сканеров

В РЕД ОС поддержка принтеров реализована через подсистему **CUPS**, а сканеров — через **SANE**.

### Подключение принтера
1. Подключите принтер USB-кабелем
2. Откройте: Меню → Система → Принтеры
3. Нажмите «Добавить принтер»
4. Система автоматически найдёт устройство
5. Нажмите «Применить»

### Если принтер не найден автоматически
Проверьте, поддерживается ли ваш принтер в Linux. Большинство принтеров HP, Canon, Samsung поддерживаются через пакет **hplip** или **gutenprint**.

### Подключение сканера
1. Подключите сканер
2. Откройте приложение **Simple Scan** или **XSane**
3. Нажмите «Сканировать»

### Зависание очереди печати
Если документ «застрял»:
1. Откройте Принтеры → выберите принтер
2. Нажмите «Отмена всех заданий»
3. Перезапустите службу: `sudo systemctl restart cups`"""),

            Lesson(id=5, module_id=2, title="Настройка сети и VPN", sort_order=2, content="""## Настройка сетевого подключения

### Проводное подключение
РЕД ОС автоматически настраивает проводное соединение при подключении кабеля. Индикатор сети отображается в системном трее (правый нижний угол).

### Настройка Wi-Fi
1. Кликните на значок сети в трее
2. Выберите сеть из списка
3. Введите пароль

### Работа с ViPNet
ViPNet Client — защищённый VPN-клиент для доступа к государственным системам.

**Запуск:** Меню → Сеть → ViPNet Client

**Проверка подключения:**
- Значок ViPNet в трее должен быть зелёным
- Нажмите правой кнопкой → «Статус» для проверки

### Типичные проблемы
| Проблема | Решение |
|----------|---------|
| Нет подключения | Проверьте кабель, перезапустите NetworkManager |
| ViPNet не соединяется | Проверьте сертификаты, перезапустите службу |
| Сайт ГИС не открывается | Проверьте плагин КриптоПро в браузере |"""),

            Lesson(id=6, module_id=3, title="Введение в электронную подпись", sort_order=1, content="""## Электронная подпись (ЭП)

**Квалифицированная электронная подпись (КЭП)** — юридически значимый аналог собственноручной подписи для электронных документов.

### Компоненты ЭП:
1. **КриптоПро CSP** — криптографический провайдер (программа)
2. **Рутокен / eToken** — ключевой носитель (USB-устройство)
3. **Сертификат** — электронный документ, удостоверяющий личность

### Зачем нужна ЭП в МФЦ?
- Подписание электронных документов в ГИС
- Доступ к порталам Госуслуги, СМЭВ
- Отправка юридически значимых запросов
- Работа с ФГИС Росаккредитации

### Срок действия
Сертификат КЭП выдаётся на **1 год**. За 30 дней до истечения система уведомит о необходимости продления. Обратитесь в Удостоверяющий центр заблаговременно!

### Важно!
Никому не сообщайте PIN-код от Рутокен и не оставляйте носитель подключённым к компьютеру без надобности."""),

            Lesson(id=7, module_id=3, title="Установка сертификата в КриптоПро", sort_order=2, content="""## Установка сертификата

### Шаг 1: Подключение Рутокен
1. Вставьте Рутокен в USB-порт
2. Дождитесь, пока индикатор на устройстве загорится
3. В системном трее появится значок Рутокен

### Шаг 2: Открытие КриптоПро
1. Меню → Безопасность → КриптоПро CSP
2. Перейдите на вкладку **«Сервис»**
3. Нажмите **«Просмотреть сертификаты в контейнере»**

### Шаг 3: Установка
1. Нажмите «Обзор» → выберите контейнер на Рутокен
2. Нажмите «Далее» → «Установить»
3. При запросе PIN-кода введите PIN (по умолчанию: **12345678**)
4. Нажмите «ОК»

### Проверка установки
Откройте браузер → Настройки → Личные данные → Сертификаты. Ваш сертификат должен быть в списке.

### Частые ошибки
- **«Контейнер не найден»** — проверьте подключение Рутокен
- **«Неверный PIN»** — введите PIN ещё раз, по умолчанию 12345678
- **«Сертификат устарел»** — требуется перевыпуск в УЦ"""),

            Lesson(id=8, module_id=3, title="Настройка браузера для работы с ГИС", sort_order=3, content="""## Настройка браузера

Для работы с государственными информационными системами (ФГИС, Госуслуги) необходимо настроить браузер.

### Поддерживаемые браузеры
- **Яндекс.Браузер** (рекомендуется)
- **Chromium**
- **Mozilla Firefox** (с дополнительной настройкой)

### Установка плагина КриптоПро
1. Откройте браузер
2. Перейдите на сайт cryptopro.ru/products/cades/plugin
3. Скачайте и установите **КриптоПро ЭЦП Browser plug-in**
4. Перезапустите браузер
5. При первом использовании разрешите работу плагина

### Добавление доверенных сайтов
Для корректной работы добавьте адреса ГИС в доверенные:
1. Настройки браузера → Безопасность
2. Добавьте адреса: gosuslugi.ru, fgis.ru, egov.tatarstan.ru

### Проверка работы
1. Перейдите на портал ГИС
2. Нажмите «Войти с помощью ЭП»
3. Система предложит выбрать сертификат
4. Выберите ваш сертификат и нажмите «ОК»"""),

            Lesson(id=9, module_id=4, title="Доступ к государственным порталам", sort_order=1, content="""## Вход в государственные системы

### Госуслуги (gosuslugi.ru)
1. Перейдите на портал
2. Нажмите «Войти» → «С помощью электронной подписи»
3. Вставьте Рутокен
4. Выберите сертификат
5. Введите PIN-код

### СМЭВ (Система межведомственного обмена)
Доступ осуществляется только из защищённой сети через ViPNet. Проверьте, что VPN-клиент подключён.

### Типичные проблемы доступа
| Проблема | Решение |
|----------|---------|
| «Сертификат не найден» | Переустановите сертификат через КриптоПро |
| «Ошибка SSL» | Добавьте сайт в исключения или обновите сертификат УЦ |
| «Плагин не работает» | Обновите КриптоПро ЭЦП Browser plug-in |
| Браузер не запрашивает подпись | Очистите кеш браузера и перезапустите |

### Если ничего не помогает
Обратитесь в техническую поддержку через форму обращений в данной системе. Укажите:
- Название портала
- Текст ошибки (сделайте скриншот)
- Версию КриптоПро CSP"""),

            Lesson(id=10, module_id=5, title="Создание и форматирование документов", sort_order=1, content="""## Работа в OnlyOffice Writer

**OnlyOffice** — российский офисный пакет, совместимый с форматами Microsoft Office (.docx, .xlsx, .pptx).

### Создание документа
1. Запустите OnlyOffice Desktop Editors
2. Нажмите «Создать» → «Документ»
3. Или откройте существующий файл через «Открыть»

### Основные инструменты форматирования
- **Жирный текст:** Ctrl+B
- **Курсив:** Ctrl+I
- **Подчёркивание:** Ctrl+U
- **Выравнивание:** иконки на панели инструментов

### Стили заголовков
Для официальных документов используйте стили:
- **Заголовок 1** — для разделов
- **Заголовок 2** — для подразделов
- **Обычный** — для основного текста

### Сохранение
- **Ctrl+S** — сохранить
- Файл → Сохранить как → выберите формат

### Поддерживаемые форматы
.docx, .doc, .odt, .rtf, .txt, .pdf (экспорт)"""),

            Lesson(id=11, module_id=5, title="Конвертация и совместимость форматов", sort_order=2, content="""## Работа с форматами файлов

### Конвертация в PDF
Для отправки в государственные системы часто требуется формат PDF:
1. Откройте документ
2. Файл → Сохранить как
3. Выберите формат **PDF**
4. Нажмите «Сохранить»

### Открытие документов от Microsoft Office
OnlyOffice полностью совместим с форматами .docx, .xlsx, .pptx. Просто откройте файл — он откроется без изменений.

### Частые проблемы совместимости
| Проблема | Решение |
|----------|---------|
| Сбилась разметка | Проверьте шрифты (Calibri → Arial) |
| Не отображаются формулы | Обновите OnlyOffice до последней версии |
| Не открывается .doc (старый формат) | Пересохраните в .docx через LibreOffice |

### Электронные подписи в документах
Для подписания документа ЭП:
1. Откройте документ
2. Вставка → Подпись
3. Выберите сертификат КриптоПро
4. Нажмите «Подписать»"""),

            Lesson(id=12, module_id=6, title="Работа в OnlyOffice Spreadsheet", sort_order=1, content="""## OnlyOffice Spreadsheet (Таблицы)

### Основы работы
OnlyOffice Spreadsheet — аналог Microsoft Excel для работы с таблицами и данными.

### Базовые операции
- **Ввод данных:** кликните по ячейке и начните ввод
- **Перемещение:** стрелки на клавиатуре или Tab
- **Выделение диапазона:** зажмите Shift и кликайте

### Основные формулы
```
=СУММ(A1:A10)    — сумма диапазона
=СРЗНАЧ(B1:B5)  — среднее значение
=СЧЁТ(C1:C20)   — количество чисел
=МАКС(D1:D10)   — максимальное значение
```

### Форматирование
- **Числа:** правой кнопкой → Формат ячеек → Число
- **Дата:** выберите формат Дата
- **Денежный:** выберите формат Денежный (рубли ₽)

### Сортировка и фильтрация
1. Выделите таблицу
2. Данные → Сортировка (по возрастанию/убыванию)
3. Данные → Автофильтр — для поиска по столбцам"""),

            Lesson(id=13, module_id=7, title="Особенности Astra Linux", sort_order=1, content="""## Astra Linux

**Astra Linux** — российская операционная система с усиленными механизмами безопасности, разработанная для применения в государственных органах и силовых структурах.

### Редакции
- **Astra Linux Common Edition** — для организаций (бесплатная)
- **Astra Linux Special Edition** — для работы с секретными данными (сертифицирована ФСБ, ФСТЭК)

### Основные отличия от обычного Linux
1. **Мандатная система разграничения доступа (МАС)** — дополнительный уровень защиты
2. **Встроенный аудит действий** — все операции записываются в журнал
3. **Защита от вирусов** — встроенный антивирус

### Рабочий стол
Astra Linux использует рабочий стол **Fly** (собственная разработка). Управление аналогично GNOME/KDE.

### Важно для МФЦ
В Astra Linux запрещена установка неавторизованного ПО без разрешения администратора безопасности. Все изменения фиксируются в журнале аудита."""),

            Lesson(id=14, module_id=7, title="Работа с почтой и документами в Astra Linux", sort_order=2, content="""## Офисные приложения в Astra Linux

### Почтовый клиент
В Astra Linux используется почтовый клиент **Evolution** или **Thunderbird**.

**Настройка почты:**
1. Открыть Evolution → Меню → Правка → Параметры учётных записей
2. Добавить новую учётную запись
3. Ввести адрес почты, сервер входящей/исходящей почты

### Работа с документами
Установленные офисные пакеты:
- **LibreOffice** — полнофункциональный офис
- **OnlyOffice** — при наличии установки администратором

### Архивирование файлов
1. Щёлкните правой кнопкой на файле
2. «Сжать» → выберите формат (.zip, .tar.gz)
3. Укажите имя архива

### Работа с подписанными документами
Для работы с документами, подписанными КЭП:
1. Установите КриптоПро CSP для Linux
2. Используйте **КриптоАРМ Linux** для проверки и создания подписей
3. В браузере установите плагин КриптоПро для ЭП"""),
        ]
        for l in lessons_data:
            existing = await db.get(Lesson, l.id)
            if not existing:
                db.add(l)
        await db.commit()

        # ---- TESTS ----
        tests_data = [
            Test(id=1,  lesson_id=1,  title="Тест по уроку: Знакомство с РЕД ОС"),
            Test(id=2,  lesson_id=2,  title="Тест: Файловая система Linux"),
            Test(id=3,  lesson_id=3,  title="Тест: Работа с терминалом"),
            Test(id=4,  lesson_id=4,  title="Тест: Подключение периферии"),
            Test(id=5,  lesson_id=5,  title="Тест: Сеть и VPN"),
            Test(id=6,  lesson_id=6,  title="Тест: Электронная подпись"),
            Test(id=7,  lesson_id=7,  title="Тест: Установка сертификата"),
            Test(id=8,  lesson_id=8,  title="Тест: Настройка браузера"),
            Test(id=9,  lesson_id=9,  title="Тест: Государственные порталы"),
            Test(id=10, lesson_id=10, title="Тест: Форматирование документов"),
            Test(id=11, lesson_id=11, title="Тест: Форматы файлов"),
            Test(id=12, lesson_id=12, title="Тест: Таблицы"),
            Test(id=13, lesson_id=13, title="Тест: Особенности Astra Linux"),
            Test(id=14, lesson_id=14, title="Тест: Офисные приложения Astra Linux"),
        ]
        for t in tests_data:
            existing = await db.get(Test, t.id)
            if not existing:
                db.add(t)
        await db.commit()

        # ---- QUESTIONS ----
        questions_data = [
            Question(id=1,  test_id=1,  text="На основе какого ядра создана РЕД ОС?", question_type="single"),
            Question(id=2,  test_id=1,  text="Для каких организаций предназначена РЕД ОС?", question_type="single"),
            Question(id=3,  test_id=1,  text="В каком реестре числится РЕД ОС?", question_type="single"),
            Question(id=4,  test_id=2,  text="С какого символа начинается корневой каталог в Linux?", question_type="single"),
            Question(id=5,  test_id=2,  text="Где хранятся личные файлы пользователя?", question_type="single"),
            Question(id=6,  test_id=2,  text="Чувствительна ли файловая система Linux к регистру?", question_type="single"),
            Question(id=7,  test_id=3,  text="Какая команда показывает содержимое текущей папки?", question_type="single"),
            Question(id=8,  test_id=3,  text="Что означает команда sudo?", question_type="single"),
            Question(id=9,  test_id=4,  text="Через какую подсистему реализована печать в Linux?", question_type="single"),
            Question(id=10, test_id=4,  text="Что делать если очередь печати зависла?", question_type="single"),
            Question(id=11, test_id=5,  text="Какого цвета должен быть значок ViPNet при успешном подключении?", question_type="single"),
            Question(id=12, test_id=6,  text="Что такое квалифицированная электронная подпись?", question_type="single"),
            Question(id=13, test_id=6,  text="Какой срок действия у сертификата КЭП?", question_type="single"),
            Question(id=14, test_id=6,  text="Из каких компонентов состоит ЭП?", question_type="multiple"),
            Question(id=15, test_id=7,  text="Какой PIN-код установлен по умолчанию на Рутокен?", question_type="single"),
            Question(id=16, test_id=7,  text="Где в КриптоПро CSP находится функция просмотра сертификатов в контейнере?", question_type="single"),
            Question(id=17, test_id=8,  text="Какой браузер рекомендуется для работы с ГИС?", question_type="single"),
            Question(id=18, test_id=9,  text="Что нужно для входа на Госуслуги с помощью ЭП?", question_type="single"),
            Question(id=19, test_id=10, text="Какое сочетание клавиш делает текст жирным в OnlyOffice?", question_type="single"),
            Question(id=20, test_id=10, text="Какой стиль заголовка используется для основных разделов?", question_type="single"),
            Question(id=21, test_id=11, text="В каком формате следует сохранять документы для государственных систем?", question_type="single"),
            Question(id=22, test_id=12, text="Какая формула вычисляет сумму диапазона A1:A10?", question_type="single"),
            Question(id=23, test_id=13, text="Какой рабочий стол используется в Astra Linux?", question_type="single"),
            Question(id=24, test_id=13, text="Что такое МАС в Astra Linux?", question_type="single"),
            Question(id=25, test_id=14, text="Какую программу используют для создания подписей КЭП в Linux?", question_type="single"),
        ]
        for q in questions_data:
            existing = await db.get(Question, q.id)
            if not existing:
                db.add(q)
        await db.commit()

        # ---- ANSWERS ----
        answers_data = [
            # Q1
            Answer(id=1,  question_id=1,  text="Windows NT", is_correct=False),
            Answer(id=2,  question_id=1,  text="Linux", is_correct=True),
            Answer(id=3,  question_id=1,  text="macOS Darwin", is_correct=False),
            Answer(id=4,  question_id=1,  text="FreeBSD", is_correct=False),
            # Q2
            Answer(id=5,  question_id=2,  text="Только для домашнего использования", is_correct=False),
            Answer(id=6,  question_id=2,  text="Государственных и корпоративных", is_correct=True),
            Answer(id=7,  question_id=2,  text="Только для разработчиков", is_correct=False),
            Answer(id=8,  question_id=2,  text="Для мобильных устройств", is_correct=False),
            # Q3
            Answer(id=9,  question_id=3,  text="Реестре зарубежного ПО", is_correct=False),
            Answer(id=10, question_id=3,  text="Едином реестре российских программ", is_correct=True),
            Answer(id=11, question_id=3,  text="Реестре антивирусных программ", is_correct=False),
            Answer(id=12, question_id=3,  text="Реестре НАТО", is_correct=False),
            # Q4
            Answer(id=13, question_id=4,  text="C:\\", is_correct=False),
            Answer(id=14, question_id=4,  text="/", is_correct=True),
            Answer(id=15, question_id=4,  text="~", is_correct=False),
            Answer(id=16, question_id=4,  text="%", is_correct=False),
            # Q5
            Answer(id=17, question_id=5,  text="/tmp", is_correct=False),
            Answer(id=18, question_id=5,  text="/etc", is_correct=False),
            Answer(id=19, question_id=5,  text="/home/имя_пользователя", is_correct=True),
            Answer(id=20, question_id=5,  text="/var", is_correct=False),
            # Q6
            Answer(id=21, question_id=6,  text="Нет, как в Windows", is_correct=False),
            Answer(id=22, question_id=6,  text="Да, «Файл.docx» и «файл.docx» — разные файлы", is_correct=True),
            Answer(id=23, question_id=6,  text="Только для системных файлов", is_correct=False),
            Answer(id=24, question_id=6,  text="Зависит от настроек", is_correct=False),
            # Q7
            Answer(id=25, question_id=7,  text="cd", is_correct=False),
            Answer(id=26, question_id=7,  text="ls", is_correct=True),
            Answer(id=27, question_id=7,  text="pwd", is_correct=False),
            Answer(id=28, question_id=7,  text="mkdir", is_correct=False),
            # Q8
            Answer(id=29, question_id=8,  text="Удалить файл", is_correct=False),
            Answer(id=30, question_id=8,  text="Выполнить команду с правами администратора", is_correct=True),
            Answer(id=31, question_id=8,  text="Создать папку", is_correct=False),
            Answer(id=32, question_id=8,  text="Показать помощь", is_correct=False),
            # Q9
            Answer(id=33, question_id=9,  text="SANE", is_correct=False),
            Answer(id=34, question_id=9,  text="CUPS", is_correct=True),
            Answer(id=35, question_id=9,  text="ALSA", is_correct=False),
            Answer(id=36, question_id=9,  text="Xorg", is_correct=False),
            # Q10
            Answer(id=37, question_id=10, text="Перезагрузить компьютер", is_correct=False),
            Answer(id=38, question_id=10, text="Отменить задания и перезапустить службу cups", is_correct=True),
            Answer(id=39, question_id=10, text="Переустановить принтер", is_correct=False),
            Answer(id=40, question_id=10, text="Ничего, подождать", is_correct=False),
            # Q11
            Answer(id=41, question_id=11, text="Красного", is_correct=False),
            Answer(id=42, question_id=11, text="Зелёного", is_correct=True),
            Answer(id=43, question_id=11, text="Жёлтого", is_correct=False),
            Answer(id=44, question_id=11, text="Синего", is_correct=False),
            # Q12
            Answer(id=45, question_id=12, text="Скан рукописной подписи", is_correct=False),
            Answer(id=46, question_id=12, text="Юридически значимый аналог собственноручной подписи", is_correct=True),
            Answer(id=47, question_id=12, text="PIN-код от Рутокен", is_correct=False),
            Answer(id=48, question_id=12, text="Логин и пароль", is_correct=False),
            # Q13
            Answer(id=49, question_id=13, text="6 месяцев", is_correct=False),
            Answer(id=50, question_id=13, text="1 год", is_correct=True),
            Answer(id=51, question_id=13, text="2 года", is_correct=False),
            Answer(id=52, question_id=13, text="Бессрочно", is_correct=False),
            # Q14 (multiple)
            Answer(id=53, question_id=14, text="КриптоПро CSP", is_correct=True),
            Answer(id=54, question_id=14, text="Рутокен / eToken", is_correct=True),
            Answer(id=55, question_id=14, text="Антивирус", is_correct=False),
            Answer(id=56, question_id=14, text="Сертификат", is_correct=True),
            # Q15
            Answer(id=57, question_id=15, text="0000", is_correct=False),
            Answer(id=58, question_id=15, text="1234", is_correct=False),
            Answer(id=59, question_id=15, text="12345678", is_correct=True),
            Answer(id=60, question_id=15, text="00000000", is_correct=False),
            # Q16
            Answer(id=61, question_id=16, text="Вкладка «Оборудование»", is_correct=False),
            Answer(id=62, question_id=16, text="Вкладка «Сервис»", is_correct=True),
            Answer(id=63, question_id=16, text="Вкладка «Общие»", is_correct=False),
            Answer(id=64, question_id=16, text="Вкладка «Безопасность»", is_correct=False),
            # Q17
            Answer(id=65, question_id=17, text="Internet Explorer", is_correct=False),
            Answer(id=66, question_id=17, text="Safari", is_correct=False),
            Answer(id=67, question_id=17, text="Яндекс.Браузер", is_correct=True),
            Answer(id=68, question_id=17, text="Opera", is_correct=False),
            # Q18
            Answer(id=69, question_id=18, text="Только логин и пароль", is_correct=False),
            Answer(id=70, question_id=18, text="Вставленный Рутокен и PIN-код", is_correct=True),
            Answer(id=71, question_id=18, text="Биометрические данные", is_correct=False),
            Answer(id=72, question_id=18, text="Ничего особенного", is_correct=False),
            # Q19
            Answer(id=73, question_id=19, text="Ctrl+I", is_correct=False),
            Answer(id=74, question_id=19, text="Ctrl+U", is_correct=False),
            Answer(id=75, question_id=19, text="Ctrl+B", is_correct=True),
            Answer(id=76, question_id=19, text="Ctrl+S", is_correct=False),
            # Q20
            Answer(id=77, question_id=20, text="Обычный", is_correct=False),
            Answer(id=78, question_id=20, text="Заголовок 1", is_correct=True),
            Answer(id=79, question_id=20, text="Заголовок 3", is_correct=False),
            Answer(id=80, question_id=20, text="Курсив", is_correct=False),
            # Q21
            Answer(id=81, question_id=21, text=".doc", is_correct=False),
            Answer(id=82, question_id=21, text=".txt", is_correct=False),
            Answer(id=83, question_id=21, text=".pdf", is_correct=True),
            Answer(id=84, question_id=21, text=".odt", is_correct=False),
            # Q22
            Answer(id=85, question_id=22, text="=ИТОГО(A1:A10)", is_correct=False),
            Answer(id=86, question_id=22, text="=СУММ(A1:A10)", is_correct=True),
            Answer(id=87, question_id=22, text="=СЛОЖИТЬ(A1:A10)", is_correct=False),
            Answer(id=88, question_id=22, text="=ВСЕГО(A1:A10)", is_correct=False),
            # Q23
            Answer(id=89, question_id=23, text="GNOME", is_correct=False),
            Answer(id=90, question_id=23, text="KDE Plasma", is_correct=False),
            Answer(id=91, question_id=23, text="Fly", is_correct=True),
            Answer(id=92, question_id=23, text="MATE", is_correct=False),
            # Q24
            Answer(id=93, question_id=24, text="Антивирусная программа", is_correct=False),
            Answer(id=94, question_id=24, text="Мандатная система разграничения доступа", is_correct=True),
            Answer(id=95, question_id=24, text="Менеджер пакетов", is_correct=False),
            Answer(id=96, question_id=24, text="Медиаплеер", is_correct=False),
            # Q25
            Answer(id=97,  question_id=25, text="Adobe Acrobat", is_correct=False),
            Answer(id=98,  question_id=25, text="КриптоАРМ Linux", is_correct=True),
            Answer(id=99,  question_id=25, text="WinRar", is_correct=False),
            Answer(id=100, question_id=25, text="Midnight Commander", is_correct=False),
        ]
        for a in answers_data:
            existing = await db.get(Answer, a.id)
            if not existing:
                db.add(a)
        await db.commit()

        # ---- FAQ ----
        faq_data = [
            FaqArticle(id=1,  category="Общее", title="Как начать обучение?",
                       content="Перейдите в раздел «Курсы», выберите нужный курс и нажмите «Перейти к курсу». Уроки проходятся последовательно — следующий открывается после успешного прохождения теста текущего (минимальный балл — 75%). Количество попыток не ограничено."),
            FaqArticle(id=2,  category="Общее", title="Тест не засчитан — что делать?",
                       content="Минимальный проходной балл — 75%. Перечитайте материал урока, обращая внимание на выделенные термины и таблицы, затем пройдите тест снова. Количество попыток не ограничено. Если у вас остались вопросы — создайте обращение в поддержку."),
            FaqArticle(id=3,  category="РЕД ОС", title="Как установить приложение в РЕД ОС?",
                       content="Используйте пакетный менеджер DNF: sudo dnf install <название>. Доступен также графический центр приложений в меню «Система». Для поиска пакета используйте: sudo dnf search <ключевое-слово>. Для обновления всей системы: sudo dnf update."),
            FaqArticle(id=4,  category="РЕД ОС", title="Как настроить принтер в РЕД ОС?",
                       content="Откройте «Система» → «Администрирование» → «Печать» или выполните в терминале: sudo system-config-printer. В открывшемся окне нажмите «Добавить», выберите тип подключения и следуйте мастеру установки. Для сетевых принтеров потребуется IP-адрес устройства."),
            FaqArticle(id=5,  category="КриптоПро", title="КриптоПро не видит USB-токен — что делать?",
                       content="Проверьте по шагам: 1) токен вставлен в USB-порт и горит индикатор; 2) служба запущена: systemctl status cprocsp; 3) установлены драйверы токена (rut-token-core или другой пакет производителя). Перезапуск службы: sudo systemctl restart cprocsp. Если не помогло — переустановите драйверы через sudo dnf reinstall rut-token-core."),
            FaqArticle(id=6,  category="КриптоПро", title="Как подписать документ электронной подписью?",
                       content="В КриптоАРМ: откройте приложение → выберите файл → нажмите «Подписать и зашифровать» → выберите действующий сертификат из хранилища → введите PIN-код токена → нажмите «Готово». Подписанный файл (.sig) сохранится рядом с оригиналом. Убедитесь, что срок действия сертификата не истёк."),
            FaqArticle(id=7,  category="OnlyOffice", title="OnlyOffice не открывает файл .doc — что делать?",
                       content="OnlyOffice автоматически конвертирует файлы .doc в .docx при открытии. Если файл не открывается — убедитесь, что он не повреждён. Для массовой конвертации используйте «Файл» → «Конвертировать в DOCX». Формат .docx полностью совместим со всеми современными версиями Word."),
            FaqArticle(id=8,  category="OnlyOffice", title="Как включить автосохранение в OnlyOffice?",
                       content="В редакторе документов: «Файл» → «Дополнительные параметры» → раздел «Сохранение». Включите «Автосохранение» и установите интервал 5–10 минут. Файл резервной копии хранится в ~/.local/share/onlyoffice/desktopeditors/temp."),
            FaqArticle(id=9,  category="Astra Linux", title="Как настроить сеть в Astra Linux?",
                       content="Нажмите на значок сети в системном трее или откройте «Параметры» → «Сеть». Для проводной сети заполните параметры (IP, маска, шлюз, DNS) согласно инструкции системного администратора. Для беспроводной сети выберите точку доступа и введите пароль. Применить настройки: sudo systemctl restart NetworkManager."),
            FaqArticle(id=10, category="Astra Linux", title="Как настроить уровень безопасности в Astra Linux?",
                       content="Astra Linux имеет встроенный механизм мандатного управления доступом (МУД). Уровень безопасности настраивается через «Параметры» → «Безопасность» или утилиту fly-admin-smc. В корпоративной среде уровень безопасности устанавливает системный администратор согласно политике ИБ организации."),
        ]
        for f in faq_data:
            existing = await db.get(FaqArticle, f.id)
            if not existing:
                db.add(f)
        await db.commit()

        # ---- TICKETS ----
        tickets_data = [
            Ticket(id=1, user_id=1, title="Не устанавливается сертификат КриптоПро",
                   message="При попытке установить сертификат появляется ошибка «Контейнер не найден». Рутокен вставлен, индикатор горит.",
                   status="closed", response="Проблема решена: требовалась переустановка драйверов Рутокен. Установлен пакет rut-token-core v6.0."),
            Ticket(id=2, user_id=1, title="Принтер не печатает после обновления РЕД ОС",
                   message="После обновления системы до версии 7.3 принтер HP LaserJet 1010 перестал работать. Очередь заданий пустая.",
                   status="in_progress", response=None),
            Ticket(id=3, user_id=1, title="Ошибка при входе на портал Госуслуги",
                   message="Браузер выдаёт ошибку SSL при переходе на gosuslugi.ru. Плагин КриптоПро установлен.",
                   status="open", response=None),
        ]
        for t in tickets_data:
            existing = await db.get(Ticket, t.id)
            if not existing:
                db.add(t)
        await db.commit()

        # Fix sequences after explicit ID inserts (after ALL data inserted)
        for table_name in ["users", "courses", "modules", "lessons", "tests",
                           "questions", "answers", "progress", "tickets", "faq"]:
            await db.execute(text(
                f"SELECT setval('{table_name}_id_seq', "
                f"COALESCE((SELECT MAX(id) FROM {table_name}), 1))"
            ))
        await db.commit()

    print("Database seeded successfully!")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
