import type { House } from "../types";

type HouseBase = Omit<
  House,
  | "apartment"
  | "relation"
  | "meters"
  | "events"
  | "requests"
  | "repairs"
  | "state"
>;

const HOUSE_CATALOG: HouseBase[] = [
  {
    "id": 1,
    "address": "ул. Пушкина, 7",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Пушкина",
    "houseNumber": "7",
    "year": 2018,
    "floors": 12,
    "entrances": 4,
    "apartments": 320,
    "type": "Панельный",
    "area": "18 420 м²",
    "company": "ООО «ЖилСервис»"
  },
  {
    "id": 2,
    "address": "ул. Пушкина, 7А",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Пушкина",
    "houseNumber": "7А",
    "year": 2016,
    "floors": 10,
    "entrances": 3,
    "apartments": 240,
    "type": "Монолитный",
    "area": "13 100 м²",
    "company": "ООО «ЖилСервис»"
  },
  {
    "id": 3,
    "address": "ул. Пушкина, 12",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Пушкина",
    "houseNumber": "12",
    "year": 2012,
    "floors": 9,
    "entrances": 3,
    "apartments": 180,
    "type": "Панельный",
    "area": "10 800 м²",
    "company": "ООО «ЖилСервис»"
  },
  {
    "id": 4,
    "address": "ул. Пушкина, 18",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Пушкина",
    "houseNumber": "18",
    "year": 2020,
    "floors": 16,
    "entrances": 5,
    "apartments": 410,
    "type": "Монолитный",
    "area": "24 500 м²",
    "company": "ООО «КомфортДом»"
  },
  {
    "id": 5,
    "address": "проспект Мира, 24",
    "city": "Москва",
    "district": "СВАО",
    "street": "проспект Мира",
    "houseNumber": "24",
    "year": 2015,
    "floors": 14,
    "entrances": 5,
    "apartments": 350,
    "type": "Монолитный",
    "area": "22 600 м²",
    "company": "ООО «КомфортДом»"
  },
  {
    "id": 6,
    "address": "проспект Мира, 26",
    "city": "Москва",
    "district": "СВАО",
    "street": "проспект Мира",
    "houseNumber": "26",
    "year": 2017,
    "floors": 17,
    "entrances": 5,
    "apartments": 430,
    "type": "Панельный",
    "area": "25 100 м²",
    "company": "ООО «КомфортДом»"
  },
  {
    "id": 7,
    "address": "проспект Мира, 28",
    "city": "Москва",
    "district": "СВАО",
    "street": "проспект Мира",
    "houseNumber": "28",
    "year": 2019,
    "floors": 20,
    "entrances": 6,
    "apartments": 510,
    "type": "Монолитный",
    "area": "30 400 м²",
    "company": "ООО «КомфортДом»"
  },
  {
    "id": 8,
    "address": "проспект Мира, 31",
    "city": "Москва",
    "district": "СВАО",
    "street": "проспект Мира",
    "houseNumber": "31",
    "year": 2010,
    "floors": 12,
    "entrances": 4,
    "apartments": 280,
    "type": "Панельный",
    "area": "17 200 м²",
    "company": "ООО «КомфортДом»"
  },
  {
    "id": 9,
    "address": "ул. Ленина, 18",
    "city": "Москва",
    "district": "ЮАО",
    "street": "ул. Ленина",
    "houseNumber": "18",
    "year": 2008,
    "floors": 9,
    "entrances": 3,
    "apartments": 190,
    "type": "Панельный",
    "area": "11 700 м²",
    "company": "ООО «ЖилСервис»"
  },
  {
    "id": 10,
    "address": "ул. Ленина, 21",
    "city": "Москва",
    "district": "ЮАО",
    "street": "ул. Ленина",
    "houseNumber": "21",
    "year": 2014,
    "floors": 12,
    "entrances": 4,
    "apartments": 270,
    "type": "Монолитный",
    "area": "16 900 м²",
    "company": "ООО «ЖилСервис»"
  },
  {
    "id": 11,
    "address": "ул. Ленина, 25",
    "city": "Москва",
    "district": "ЮАО",
    "street": "ул. Ленина",
    "houseNumber": "25",
    "year": 2006,
    "floors": 9,
    "entrances": 4,
    "apartments": 216,
    "type": "Кирпичный",
    "area": "13 200 м²",
    "company": "ООО «ЖилСервис»"
  },
  {
    "id": 12,
    "address": "ул. Ленина, 30",
    "city": "Москва",
    "district": "ЮАО",
    "street": "ул. Ленина",
    "houseNumber": "30",
    "year": 2021,
    "floors": 18,
    "entrances": 6,
    "apartments": 460,
    "type": "Монолитный",
    "area": "28 700 м²",
    "company": "ООО «КомфортДом»"
  },
  {
    "id": 13,
    "address": "ул. Садовая, 5",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Садовая",
    "houseNumber": "5",
    "year": 1998,
    "floors": 7,
    "entrances": 2,
    "apartments": 96,
    "type": "Кирпичный",
    "area": "6 400 м²",
    "company": "ООО «ГородДом»"
  },
  {
    "id": 14,
    "address": "ул. Садовая, 7",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Садовая",
    "houseNumber": "7",
    "year": 2002,
    "floors": 8,
    "entrances": 2,
    "apartments": 120,
    "type": "Кирпичный",
    "area": "7 500 м²",
    "company": "ООО «ГородДом»"
  },
  {
    "id": 15,
    "address": "ул. Садовая, 10",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Садовая",
    "houseNumber": "10",
    "year": 2011,
    "floors": 10,
    "entrances": 3,
    "apartments": 210,
    "type": "Панельный",
    "area": "12 800 м²",
    "company": "ООО «ГородДом»"
  },
  {
    "id": 16,
    "address": "ул. Тверская, 8",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Тверская",
    "houseNumber": "8",
    "year": 1956,
    "floors": 8,
    "entrances": 2,
    "apartments": 84,
    "type": "Кирпичный",
    "area": "6 900 м²",
    "company": "ООО «ЦентрЖил»"
  },
  {
    "id": 17,
    "address": "ул. Тверская, 12",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Тверская",
    "houseNumber": "12",
    "year": 1964,
    "floors": 9,
    "entrances": 2,
    "apartments": 108,
    "type": "Кирпичный",
    "area": "8 100 м²",
    "company": "ООО «ЦентрЖил»"
  },
  {
    "id": 18,
    "address": "ул. Тверская, 15",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Тверская",
    "houseNumber": "15",
    "year": 2009,
    "floors": 11,
    "entrances": 3,
    "apartments": 150,
    "type": "Монолитный",
    "area": "10 300 м²",
    "company": "ООО «ЦентрЖил»"
  },
  {
    "id": 19,
    "address": "Ленинградский проспект, 24",
    "city": "Москва",
    "district": "САО",
    "street": "Ленинградский проспект",
    "houseNumber": "24",
    "year": 2013,
    "floors": 16,
    "entrances": 5,
    "apartments": 380,
    "type": "Монолитный",
    "area": "23 600 м²",
    "company": "ООО «СеверДом»"
  },
  {
    "id": 20,
    "address": "Ленинградский проспект, 31",
    "city": "Москва",
    "district": "САО",
    "street": "Ленинградский проспект",
    "houseNumber": "31",
    "year": 2018,
    "floors": 22,
    "entrances": 6,
    "apartments": 540,
    "type": "Монолитный",
    "area": "32 800 м²",
    "company": "ООО «СеверДом»"
  },
  {
    "id": 21,
    "address": "Ленинградский проспект, 35",
    "city": "Москва",
    "district": "САО",
    "street": "Ленинградский проспект",
    "houseNumber": "35",
    "year": 2020,
    "floors": 24,
    "entrances": 7,
    "apartments": 620,
    "type": "Монолитный",
    "area": "37 900 м²",
    "company": "ООО «СеверДом»"
  },
  {
    "id": 22,
    "address": "Кутузовский проспект, 10",
    "city": "Москва",
    "district": "ЗАО",
    "street": "Кутузовский проспект",
    "houseNumber": "10",
    "year": 1960,
    "floors": 10,
    "entrances": 3,
    "apartments": 130,
    "type": "Кирпичный",
    "area": "9 200 м²",
    "company": "ООО «ЗападЖил»"
  },
  {
    "id": 23,
    "address": "Кутузовский проспект, 18",
    "city": "Москва",
    "district": "ЗАО",
    "street": "Кутузовский проспект",
    "houseNumber": "18",
    "year": 2007,
    "floors": 14,
    "entrances": 4,
    "apartments": 290,
    "type": "Монолитный",
    "area": "18 300 м²",
    "company": "ООО «ЗападЖил»"
  },
  {
    "id": 24,
    "address": "Кутузовский проспект, 25",
    "city": "Москва",
    "district": "ЗАО",
    "street": "Кутузовский проспект",
    "houseNumber": "25",
    "year": 2019,
    "floors": 20,
    "entrances": 6,
    "apartments": 470,
    "type": "Монолитный",
    "area": "29 100 м²",
    "company": "ООО «ЗападЖил»"
  },
  {
    "id": 25,
    "address": "ул. Арбат, 12",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Арбат",
    "houseNumber": "12",
    "year": 1938,
    "floors": 6,
    "entrances": 2,
    "apartments": 54,
    "type": "Кирпичный",
    "area": "5 100 м²",
    "company": "ООО «ЦентрЖил»"
  },
  {
    "id": 26,
    "address": "ул. Арбат, 20",
    "city": "Москва",
    "district": "ЦАО",
    "street": "ул. Арбат",
    "houseNumber": "20",
    "year": 1952,
    "floors": 7,
    "entrances": 2,
    "apartments": 68,
    "type": "Кирпичный",
    "area": "5 900 м²",
    "company": "ООО «ЦентрЖил»"
  },
  {
    "id": 27,
    "address": "ул. Гагарина, 3",
    "city": "Москва",
    "district": "ЮЗАО",
    "street": "ул. Гагарина",
    "houseNumber": "3",
    "year": 2004,
    "floors": 12,
    "entrances": 4,
    "apartments": 260,
    "type": "Панельный",
    "area": "15 800 м²",
    "company": "ООО «ЮгДом»"
  },
  {
    "id": 28,
    "address": "ул. Гагарина, 8",
    "city": "Москва",
    "district": "ЮЗАО",
    "street": "ул. Гагарина",
    "houseNumber": "8",
    "year": 2016,
    "floors": 17,
    "entrances": 5,
    "apartments": 390,
    "type": "Монолитный",
    "area": "24 200 м²",
    "company": "ООО «ЮгДом»"
  },
  {
    "id": 29,
    "address": "ул. Молодёжная, 14",
    "city": "Москва",
    "district": "ЗАО",
    "street": "ул. Молодёжная",
    "houseNumber": "14",
    "year": 2011,
    "floors": 14,
    "entrances": 4,
    "apartments": 300,
    "type": "Панельный",
    "area": "18 100 м²",
    "company": "ООО «ЗападЖил»"
  },
  {
    "id": 30,
    "address": "ул. Молодёжная, 20",
    "city": "Москва",
    "district": "ЗАО",
    "street": "ул. Молодёжная",
    "houseNumber": "20",
    "year": 2022,
    "floors": 21,
    "entrances": 6,
    "apartments": 520,
    "type": "Монолитный",
    "area": "31 600 м²",
    "company": "ООО «ЗападЖил»"
  },
  {
    "id": 31,
    "address": "ул. Академика Королёва, 5",
    "city": "Москва",
    "district": "СВАО",
    "street": "ул. Академика Королёва",
    "houseNumber": "5",
    "year": 2005,
    "floors": 14,
    "entrances": 4,
    "apartments": 310,
    "type": "Панельный",
    "area": "18 900 м²",
    "company": "ООО «КомфортДом»"
  },
  {
    "id": 32,
    "address": "ул. Академика Королёва, 12",
    "city": "Москва",
    "district": "СВАО",
    "street": "ул. Академика Королёва",
    "houseNumber": "12",
    "year": 2017,
    "floors": 19,
    "entrances": 5,
    "apartments": 440,
    "type": "Монолитный",
    "area": "27 100 м²",
    "company": "ООО «КомфортДом»"
  },
  {
    "id": 33,
    "address": "ул. Новая, 4",
    "city": "Москва",
    "district": "ВАО",
    "street": "ул. Новая",
    "houseNumber": "4",
    "year": 2001,
    "floors": 9,
    "entrances": 3,
    "apartments": 180,
    "type": "Панельный",
    "area": "10 900 м²",
    "company": "ООО «ВостокДом»"
  },
  {
    "id": 34,
    "address": "ул. Новая, 9",
    "city": "Москва",
    "district": "ВАО",
    "street": "ул. Новая",
    "houseNumber": "9",
    "year": 2015,
    "floors": 15,
    "entrances": 5,
    "apartments": 340,
    "type": "Монолитный",
    "area": "21 000 м²",
    "company": "ООО «ВостокДом»"
  },
  {
    "id": 35,
    "address": "ул. Центральная, 6",
    "city": "Москва",
    "district": "ВАО",
    "street": "ул. Центральная",
    "houseNumber": "6",
    "year": 1999,
    "floors": 9,
    "entrances": 3,
    "apartments": 170,
    "type": "Панельный",
    "area": "10 400 м²",
    "company": "ООО «ВостокДом»"
  },
  {
    "id": 36,
    "address": "ул. Центральная, 15",
    "city": "Москва",
    "district": "ВАО",
    "street": "ул. Центральная",
    "houseNumber": "15",
    "year": 2018,
    "floors": 16,
    "entrances": 5,
    "apartments": 360,
    "type": "Монолитный",
    "area": "22 300 м²",
    "company": "ООО «ВостокДом»"
  }
];

export const DEFAULT_HOUSE_IDS = [1, 5, 9];

export const DEFAULT_HOUSE_RELATIONS: Record<
  number,
  { apartment: string; relation: string }
> = {
  1: { apartment: "45", relation: "owner" },
  5: { apartment: "8", relation: "owner" },
  9: { apartment: "12", relation: "owner" },
};

function nextSubmissionDate() {
  const now = new Date();
  const year = now.getFullYear();
  let month = now.getMonth();

  if (now.getDate() > 25) {
    month += 1;
  }

  return new Date(
    year,
    month,
    25,
    23,
    59,
    0
  ).toISOString();
}

function defaultMeters(
  buildingId: number,
  submissionRequired = false
) {
  return [
    {
      id: buildingId * 100 + 1,
      buildingId,
      kind: "cold_water",
      name: "Холодная вода",
      unit: "м³",
      lastValue: String(110 + buildingId * 10),
      nextSubmissionDate: nextSubmissionDate(),
      submissionRequired,
    },
    {
      id: buildingId * 100 + 2,
      buildingId,
      kind: "hot_water",
      name: "Горячая вода",
      unit: "м³",
      lastValue: String(70 + buildingId * 5),
      nextSubmissionDate: nextSubmissionDate(),
      submissionRequired,
    },
    {
      id: buildingId * 100 + 3,
      buildingId,
      kind: "electricity",
      name: "Электроэнергия",
      unit: "кВт⋅ч",
      lastValue: String(1800 + buildingId * 30),
      nextSubmissionDate: nextSubmissionDate(),
      submissionRequired: false,
    },
  ];
}

function defaultRepairs(buildingId: number) {
  const year = new Date().getFullYear();

  return [
    {
      id: buildingId * 100 + 49,
      buildingId,
      title: "Починили входную дверь",
      description: "Заменили доводчик и отрегулировали замок.",
      status: "DONE",
      year,
      severity: "info" as const,
      requiresAttention: false,
    },
    {
      id: buildingId * 100 + 50,
      buildingId,
      title: "Восстановили фонтан во дворе",
      description: "Очистили чашу, обновили насос и подсветку.",
      status: "DONE",
      year,
      severity: "info" as const,
      requiresAttention: false,
    },
    {
      id: buildingId * 100 + 51,
      buildingId,
      title: "Плановое обслуживание инженерных систем",
      description: "Регламентные работы завершены.",
      status: "DONE",
      year: year - 1,
      severity: "info" as const,
      requiresAttention: false,
    },
    {
      id: buildingId * 100 + 52,
      buildingId,
      title: "Ремонт кровли",
      description:
        "Работы включены в план капитального ремонта.",
      status: "PLANNED",
      year: year + 1,
      severity: "info" as const,
      requiresAttention: false,
    },
    {
      id: buildingId * 100 + 53,
      buildingId,
      title: "Ремонт фасада",
      description:
        "Работы запланированы программой капитального ремонта.",
      status: "PLANNED",
      year: year + 3,
      severity: "info" as const,
      requiresAttention: false,
    },
  ];
}

const eventsByHouse: Record<
  number,
  House["events"]
> = {
  1: [
    {
      id: 1001,
      buildingId: 1,
      type: "important",
      severity: "attention",
      title: "Сломана входная дверь в первом подъезде",
      body:
        "Дверь не закрывается из-за неисправного доводчика. Заявка передана мастеру, ремонт запланирован на сегодня с 16:00 до 18:00.",
      date: "Сегодня",
      icon: "🚪",
      requiresAttention: true,
      resolved: false,
    },
    {
      id: 1002,
      buildingId: 1,
      type: "work",
      severity: "info",
      title: "Промывка системы отопления",
      body:
        "Во вторник специалисты проведут профилактическую промывку системы отопления. Доступ в квартиры не потребуется.",
      date: "Завтра",
      icon: "🔧",
      requiresAttention: false,
      resolved: false,
    },
    {
      id: 1003,
      buildingId: 1,
      type: "good",
      severity: "info",
      title: "Во дворе установили новые фонари",
      body:
        "Заменили шесть опор освещения у детской площадки и настроили автоматическое включение в вечернее время.",
      date: "2 дня назад",
      icon: "💡",
      requiresAttention: false,
      resolved: false,
    },
  ],
  5: [
    {
      id: 5001,
      buildingId: 5,
      type: "important",
      severity: "urgent",
      title: "Не работает пассажирский лифт",
      body:
        "Лифт во втором подъезде остановлен из-за неисправности привода дверей. Подрядчик уже проводит диагностику, восстановление ожидается до 20:00.",
      date: "Сегодня",
      icon: "🛗",
      requiresAttention: true,
      resolved: false,
    },
    {
      id: 5002,
      buildingId: 5,
      type: "announcement",
      severity: "info",
      title: "Собрание собственников 3 октября",
      body:
        "Обсудим благоустройство двора, установку камер у подъездов и план текущего ремонта на следующий год.",
      date: "Сегодня",
      icon: "📋",
      requiresAttention: false,
      resolved: false,
    },
    {
      id: 5003,
      buildingId: 5,
      type: "good",
      severity: "info",
      title: "Завершили ремонт входной группы",
      body:
        "В первом подъезде покрасили стены, заменили почтовые ящики и установили энергосберегающие светильники.",
      date: "Вчера",
      icon: "✨",
      requiresAttention: false,
      resolved: false,
    },
  ],
  9: [
    {
      id: 9001,
      buildingId: 9,
      type: "work",
      severity: "attention",
      title: "Протечка кровли над девятым этажом",
      body:
        "После сильного дождя обнаружена протечка над квартирой 87. Аварийная бригада выполнила временную герметизацию, основной ремонт назначен на завтра.",
      date: "Вчера",
      icon: "🏠",
      requiresAttention: true,
      resolved: false,
    },
    {
      id: 9002,
      buildingId: 9,
      type: "good",
      severity: "info",
      title: "Открыли обновлённую детскую площадку",
      body:
        "Установили безопасное покрытие, новые игровые элементы, освещение и лавочки. Площадка уже открыта для жителей.",
      date: "2 часа назад",
      icon: "🌿",
      requiresAttention: false,
      resolved: false,
    },
    {
      id: 9003,
      buildingId: 9,
      type: "useful",
      severity: "info",
      title: "Проверка пожарной сигнализации",
      body:
        "В четверг с 11:00 до 13:00 подрядчик проверит датчики и систему оповещения. Кратковременный звуковой сигнал является частью проверки.",
      date: "Сегодня",
      icon: "🛡️",
      requiresAttention: false,
      resolved: false,
    },
  ],
};

const requestsByHouse: Record<
  number,
  House["requests"]
> = {
  1: [
    {
      id: 1200,
      buildingId: 1,
      category: "Общее имущество",
      description: "Сломана входная дверь в подъезде № 1",
      status: "IN_PROGRESS",
      residents: 12,
      isMine: false,
      collective: true,
      canEdit: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 1203,
      buildingId: 1,
      category: "Двор",
      description:
        "Ямы во дворе возле детской площадки",
      status: "DONE",
      residents: 15,
      isMine: true,
      canEdit: true,
    },
  ],
  5: [
    {
      id: 5200,
      buildingId: 5,
      category: "Лифт",
      description: "Не работает пассажирский лифт во втором подъезде",
      status: "ACCEPTED",
      residents: 9,
      isMine: true,
      collective: true,
      canEdit: true,
      createdAt: new Date().toISOString(),
    },
  ],
  9: [
    {
      id: 9200,
      buildingId: 9,
      category: "Кровля",
      description: "Протечка кровли над квартирой 87",
      status: "WAITING",
      residents: 4,
      isMine: true,
      collective: true,
      canEdit: true,
      createdAt: new Date().toISOString(),
    },
  ],
};

function buildHouse(base: HouseBase): House {
  const needsMeters = base.id === 1;

  return {
    ...base,
    image:
      base.id === 1
        ? "/assets/houses/pushkina-7.png"
        : base.id === 2
          ? "/assets/houses/pushkina-7a.png"
          : base.id === 3
            ? "/assets/houses/pushkina-12.png"
        : base.id === 5
          ? "/assets/houses/mira-24.png"
          : base.id === 9
            ? "/assets/houses/lenina-18.png"
            : undefined,
    emergencyPhone: "+7 (495) 123-45-67",
    meters: defaultMeters(
      base.id,
      needsMeters
    ),
    events: eventsByHouse[base.id] || [],
    requests:
      requestsByHouse[base.id] || [],
    repairs: defaultRepairs(base.id),
  };
}

/**
 * Офлайн/демо-снимок базы.
 *
 * В рабочем режиме фронтенд получает эти же сущности из backend API.
 * Здесь нет status/statusText/meterText/eventsText: всё вычисляется
 * из meters/events/requests/repairs.
 */
export const housesDatabase: House[] =
  HOUSE_CATALOG
    .filter((house) => DEFAULT_HOUSE_IDS.includes(house.id))
    .map(buildHouse);

export function cloneHouse(house: House): House {
  return structuredClone(house);
}

export function getHouseFromDatabase(
  id: number
): House | undefined {
  const house = housesDatabase.find(
    (item) => item.id === id
  );

  return house ? cloneHouse(house) : undefined;
}

export function getDemoCatalog(): House[] {
  return housesDatabase.map(cloneHouse);
}

export function getDemoMyHouses(
  ids: number[] = DEFAULT_HOUSE_IDS
): House[] {
  return ids
    .map((id) => getHouseFromDatabase(id))
    .filter((house): house is House => Boolean(house))
    .map((house) => {
      const relation =
        DEFAULT_HOUSE_RELATIONS[house.id];

      return {
        ...house,
        apartment:
          relation?.apartment || "",
        relation:
          relation?.relation || "resident",
      };
    });
}
