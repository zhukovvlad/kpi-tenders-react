import type { ConstructionSite, SiteListItem } from "@/types/site"
import type { Document } from "@/types/document"
import type {
  ExtractionKey,
  ExtractedDataItem,
} from "@/types/extraction-key"
import type {
  ExtractionRequest,
  ExtractionAnswer,
} from "@/types/extraction"
import type { SiteEvent } from "@/types/site-event"
import type { ComparisonSession } from "@/types/comparison"
import type { User } from "@/types/auth"

// ============================================================================
// Сид-данные mock-слоя. Все ID — детерминированные UUID-подобные строки,
// чтобы при ребиле ссылки между сущностями не расползались.
// ============================================================================

const ORG_ID = "00000000-0000-0000-0000-00000000aaaa"
const USER_ME_ID = "00000000-0000-0000-0000-00000000bbbb"
const USER_PARTNER_ID = "00000000-0000-0000-0000-00000000cccc"

// Простой генератор «UUID для моков», чтобы было удобно читать в логах.
const id = (suffix: string) => `00000000-0000-0000-0000-${suffix.padStart(12, "0")}`

const now = () => new Date().toISOString()
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

// ── Пользователь и организация ─────────────────────────────────────────────

export const MOCK_USER: User = {
  id: USER_ME_ID,
  org_id: ORG_ID,
  email: "demo@kpi-tenders.local",
  full_name: "Алексей Демонстратор",
  role: "admin",
}

// ── Объекты строительства ──────────────────────────────────────────────────

interface SiteSeed {
  id: string
  parent_id: string | null
  name: string
  status: "active" | "completed" | "archived"
  cover?: string | null
  created_days_ago: number
  inflation_pct: number | null
  aggregate_status: SiteListItem["aggregate_status"]
}

const SITE_SEEDS: SiteSeed[] = [
  {
    id: id("0001"),
    parent_id: null,
    name: "ЖК Сити Бей",
    status: "active",
    cover: null,
    created_days_ago: 120,
    inflation_pct: 6.8,
    aggregate_status: "attention",
  },
  {
    id: id("0002"),
    parent_id: id("0001"),
    name: "6-я очередь",
    status: "active",
    cover: null,
    created_days_ago: 90,
    inflation_pct: 4.2,
    aggregate_status: "ready",
  },
  {
    id: id("0003"),
    parent_id: id("0002"),
    name: "Корпус 5",
    status: "active",
    cover: null,
    created_days_ago: 30,
    inflation_pct: null,
    aggregate_status: "processing",
  },
  {
    id: id("0004"),
    parent_id: id("0001"),
    name: "8-я очередь",
    status: "active",
    cover: null,
    created_days_ago: 15,
    inflation_pct: 8.1,
    aggregate_status: "attention",
  },
  {
    id: id("0005"),
    parent_id: null,
    name: "ЖК Северный",
    status: "active",
    cover: null,
    created_days_ago: 200,
    inflation_pct: 3.1,
    aggregate_status: "ready",
  },
  {
    id: id("0006"),
    parent_id: id("0005"),
    name: "Очередь 2",
    status: "active",
    cover: null,
    created_days_ago: 60,
    inflation_pct: null,
    aggregate_status: "empty",
  },
  {
    id: id("0007"),
    parent_id: null,
    name: "БЦ Парк Сухаревский",
    status: "completed",
    cover: null,
    created_days_ago: 320,
    inflation_pct: 1.4,
    aggregate_status: "ready",
  },
  {
    id: id("0008"),
    parent_id: null,
    name: "Логопарк Север-2",
    status: "archived",
    cover: null,
    created_days_ago: 540,
    inflation_pct: null,
    aggregate_status: "ready",
  },
]

export const MOCK_SITES: ConstructionSite[] = SITE_SEEDS.map((s) => ({
  id: s.id,
  organization_id: ORG_ID,
  parent_id: s.parent_id,
  name: s.name,
  status: s.status,
  created_by: USER_ME_ID,
  created_at: daysAgo(s.created_days_ago),
  updated_at: daysAgo(Math.max(0, s.created_days_ago - 5)),
  cover_image_path: s.cover ?? null,
  cover_image_uploaded_at: null,
}))

const siteName = (siteId: string): string =>
  MOCK_SITES.find((s) => s.id === siteId)?.name ?? ""

function siteBreadcrumbs(siteId: string): string[] {
  const chain: string[] = []
  let current = MOCK_SITES.find((s) => s.id === siteId)
  while (current) {
    chain.unshift(current.name)
    current = current.parent_id
      ? MOCK_SITES.find((s) => s.id === current!.parent_id)
      : undefined
  }
  return chain
}

// ── Документы ──────────────────────────────────────────────────────────────

interface DocSeed {
  id: string
  site_id: string
  contract_kind: Document["contract_kind"]
  bundle_id: string | null // если null — это bundle root (будет ссылаться сам на себя)
  file_name: string
  display_name?: string
  mime_type: string
  size_bytes: number
  created_days_ago: number
}

const DOC_SEEDS: DocSeed[] = [
  // Сити Бей · 6-я очередь · ГП — комплект договор + смета + ТЗ
  {
    id: id("d001"),
    site_id: id("0002"),
    contract_kind: "gp",
    bundle_id: null,
    file_name: "GP_Sity-Bey_6.docx",
    display_name: "Договор подряда №ГП-123 от 15.12.2025",
    mime_type:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size_bytes: 1_240_000,
    created_days_ago: 45,
  },
  {
    id: id("d002"),
    site_id: id("0002"),
    contract_kind: "estimate",
    bundle_id: id("d001"),
    file_name: "Smeta_Sity-Bey_6.xlsx",
    display_name: "Смета к договору ГП-123",
    mime_type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size_bytes: 845_000,
    created_days_ago: 45,
  },
  {
    id: id("d003"),
    site_id: id("0002"),
    contract_kind: "tz",
    bundle_id: id("d001"),
    file_name: "TZ_Sity-Bey_6.pdf",
    display_name: "Техническое задание ГП-123",
    mime_type: "application/pdf",
    size_bytes: 2_100_000,
    created_days_ago: 45,
  },
  // Сити Бей · 6-я очередь · Стройконтроль
  {
    id: id("d010"),
    site_id: id("0002"),
    contract_kind: "construction_control",
    bundle_id: null,
    file_name: "SK_Sity-Bey_6.docx",
    display_name: "Договор стройконтроля №88 от 02.02.2026",
    mime_type:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size_bytes: 920_000,
    created_days_ago: 30,
  },
  // Сити Бей · 8-я очередь · ГП (в работе)
  {
    id: id("d020"),
    site_id: id("0004"),
    contract_kind: "gp",
    bundle_id: null,
    file_name: "GP_Sity-Bey_8.docx",
    display_name: "Договор подряда №ГП-145 от 20.04.2026",
    mime_type:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size_bytes: 1_310_000,
    created_days_ago: 8,
  },
  {
    id: id("d021"),
    site_id: id("0004"),
    contract_kind: "estimate",
    bundle_id: id("d020"),
    file_name: "Smeta_Sity-Bey_8.xlsx",
    display_name: "Смета к договору ГП-145",
    mime_type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size_bytes: 720_000,
    created_days_ago: 8,
  },
  // ЖК Северный · ГП
  {
    id: id("d030"),
    site_id: id("0005"),
    contract_kind: "gp",
    bundle_id: null,
    file_name: "GP_Severnyj.docx",
    display_name: "Договор подряда №ГП-77 от 10.10.2025",
    mime_type:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size_bytes: 1_080_000,
    created_days_ago: 195,
  },
  {
    id: id("d031"),
    site_id: id("0005"),
    contract_kind: "estimate",
    bundle_id: id("d030"),
    file_name: "Smeta_Severnyj.xlsx",
    display_name: "Смета к договору ГП-77",
    mime_type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size_bytes: 690_000,
    created_days_ago: 195,
  },
  // БЦ Парк Сухаревский · ГП
  {
    id: id("d040"),
    site_id: id("0007"),
    contract_kind: "gp",
    bundle_id: null,
    file_name: "GP_Suharevsky.docx",
    display_name: "Договор подряда №ГП-12 от 03.05.2024",
    mime_type:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size_bytes: 990_000,
    created_days_ago: 320,
  },
]

export const MOCK_DOCUMENTS: Document[] = DOC_SEEDS.map((d) => ({
  id: d.id,
  organization_id: ORG_ID,
  site_id: d.site_id,
  uploaded_by: USER_ME_ID,
  parent_id: null,
  artifact_kind: null,
  file_name: d.file_name,
  mime_type: d.mime_type,
  file_size_bytes: d.size_bytes,
  created_at: daysAgo(d.created_days_ago),
  updated_at: daysAgo(Math.max(0, d.created_days_ago - 1)),
  contract_kind: d.contract_kind,
  bundle_id: d.bundle_id ?? d.id, // root указывает сам на себя
  display_name: d.display_name ?? null,
}))

// ── Ключи извлечения ───────────────────────────────────────────────────────

export const MOCK_KEYS: ExtractionKey[] = [
  {
    id: id("k001"),
    organization_id: null,
    key_name: "advance_pct",
    source_query: "Какой процент аванса предусмотрен договором?",
    data_type: "number",
    display_name: "Аванс",
    created_at: daysAgo(180),
    document_count: 24,
  },
  {
    id: id("k002"),
    organization_id: null,
    key_name: "term_months",
    source_query: "Какой срок выполнения работ в месяцах?",
    data_type: "number",
    display_name: "Срок, мес.",
    created_at: daysAgo(180),
    document_count: 22,
  },
  {
    id: id("k003"),
    organization_id: null,
    key_name: "warranty_years",
    source_query: "Какова гарантия по договору в годах?",
    data_type: "number",
    display_name: "Гарантия",
    created_at: daysAgo(180),
    document_count: 21,
  },
  {
    id: id("k004"),
    organization_id: null,
    key_name: "total_area_m2",
    source_query: "Какая общая площадь объекта в квадратных метрах?",
    data_type: "number",
    display_name: "Общая площадь, м²",
    created_at: daysAgo(180),
    document_count: 18,
  },
  {
    id: id("k005"),
    organization_id: null,
    key_name: "concrete_volume_m3",
    source_query:
      "Какой объём железобетонных работ предусмотрен договором, м³?",
    data_type: "number",
    display_name: "Объём ж/б, м³",
    created_at: daysAgo(180),
    document_count: 14,
  },
  {
    id: id("k006"),
    organization_id: null,
    key_name: "rebar_tons",
    source_query: "Какой объём арматуры по договору, т?",
    data_type: "number",
    display_name: "Арматура, т",
    created_at: daysAgo(180),
    document_count: 12,
  },
  {
    id: id("k007"),
    organization_id: null,
    key_name: "penalty_rate",
    source_query: "Какова ставка пени за просрочку?",
    data_type: "string",
    display_name: "Ставка пени",
    created_at: daysAgo(180),
    document_count: 9,
  },
  {
    id: id("k008"),
    organization_id: null,
    key_name: "contract_amount",
    source_query: "Какая общая стоимость договора?",
    data_type: "string",
    display_name: "Стоимость договора",
    created_at: daysAgo(180),
    document_count: 22,
  },
  {
    id: id("k101"),
    organization_id: ORG_ID,
    key_name: "pile_field_length",
    source_query: "Какова длина свайного поля по договору, в метрах?",
    data_type: "number",
    display_name: "Свайное поле, м",
    created_at: daysAgo(40),
    document_count: 3,
  },
  {
    id: id("k102"),
    organization_id: ORG_ID,
    key_name: "subcontractor_share",
    source_query: "Какая доля субподряда разрешена договором, в процентах?",
    data_type: "number",
    display_name: "Доля субподряда",
    created_at: daysAgo(20),
    document_count: 4,
  },
]

// ── Извлечённые значения ───────────────────────────────────────────────────

interface ExtractedSeed {
  document_id: string
  key_name: string
  value: string | null
}

const EXTRACTED_SEEDS: ExtractedSeed[] = [
  // ГП-123 (Сити Бей · 6-я)
  { document_id: id("d001"), key_name: "advance_pct", value: "20%" },
  { document_id: id("d001"), key_name: "term_months", value: "18" },
  { document_id: id("d001"), key_name: "warranty_years", value: "5" },
  { document_id: id("d001"), key_name: "total_area_m2", value: "42 800" },
  { document_id: id("d001"), key_name: "concrete_volume_m3", value: "8 940" },
  { document_id: id("d001"), key_name: "rebar_tons", value: "1 240" },
  { document_id: id("d001"), key_name: "penalty_rate", value: "0,1% / день" },
  {
    document_id: id("d001"),
    key_name: "contract_amount",
    value: "1 240 000 000 ₽",
  },
  { document_id: id("d001"), key_name: "pile_field_length", value: "560" },
  { document_id: id("d001"), key_name: "subcontractor_share", value: "30%" },

  // СК-88 (Сити Бей · 6-я)
  { document_id: id("d010"), key_name: "advance_pct", value: "10%" },
  { document_id: id("d010"), key_name: "term_months", value: "20" },
  { document_id: id("d010"), key_name: "warranty_years", value: "3" },
  {
    document_id: id("d010"),
    key_name: "contract_amount",
    value: "62 000 000 ₽",
  },

  // ГП-77 (ЖК Северный)
  { document_id: id("d030"), key_name: "advance_pct", value: "15%" },
  { document_id: id("d030"), key_name: "term_months", value: "16" },
  { document_id: id("d030"), key_name: "warranty_years", value: "5" },
  { document_id: id("d030"), key_name: "total_area_m2", value: "38 600" },
  { document_id: id("d030"), key_name: "concrete_volume_m3", value: "7 480" },
  { document_id: id("d030"), key_name: "rebar_tons", value: "1 050" },
  { document_id: id("d030"), key_name: "penalty_rate", value: "0,15% / день" },
  {
    document_id: id("d030"),
    key_name: "contract_amount",
    value: "1 080 000 000 ₽",
  },
  { document_id: id("d030"), key_name: "pile_field_length", value: "490" },
  { document_id: id("d030"), key_name: "subcontractor_share", value: "25%" },

  // ГП-12 (Сухаревский)
  { document_id: id("d040"), key_name: "advance_pct", value: "25%" },
  { document_id: id("d040"), key_name: "term_months", value: "14" },
  { document_id: id("d040"), key_name: "warranty_years", value: "3" },
  { document_id: id("d040"), key_name: "total_area_m2", value: "24 200" },
  { document_id: id("d040"), key_name: "concrete_volume_m3", value: "5 100" },
  { document_id: id("d040"), key_name: "penalty_rate", value: "0,1% / день" },
  {
    document_id: id("d040"),
    key_name: "contract_amount",
    value: "780 000 000 ₽",
  },
  { document_id: id("d040"), key_name: "subcontractor_share", value: "20%" },

  // ГП-145 (Сити Бей · 8-я) — частично
  { document_id: id("d020"), key_name: "advance_pct", value: "30%" },
  { document_id: id("d020"), key_name: "term_months", value: "22" },
  { document_id: id("d020"), key_name: "warranty_years", value: "5" },
  { document_id: id("d020"), key_name: "total_area_m2", value: "46 100" },
  {
    document_id: id("d020"),
    key_name: "contract_amount",
    value: "1 380 000 000 ₽",
  },
]

export const MOCK_EXTRACTED: ExtractedDataItem[] = EXTRACTED_SEEDS.map(
  (e, idx) => {
    const key = MOCK_KEYS.find((k) => k.key_name === e.key_name)
    if (!key) {
      throw new Error(`mock seed: unknown key_name ${e.key_name}`)
    }
    return {
      id: id(`e${(idx + 1).toString().padStart(3, "0")}`),
      document_id: e.document_id,
      key,
      extracted_value: e.value,
    }
  },
)

// ── Запросы экстракции (история) ───────────────────────────────────────────

export const MOCK_EXTRACTION_REQUESTS: ExtractionRequest[] = [
  {
    id: id("r001"),
    document_id: id("d001"),
    status: "completed",
    anonymize: true,
    questions: [
      "Какой процент аванса предусмотрен договором?",
      "Какой срок выполнения работ в месяцах?",
      "Какова гарантия по договору в годах?",
      "Какая общая площадь объекта в квадратных метрах?",
    ],
    resolved_schema: [
      { key_name: "advance_pct", data_type: "number" },
      { key_name: "term_months", data_type: "number" },
      { key_name: "warranty_years", data_type: "number" },
      { key_name: "total_area_m2", data_type: "number" },
    ],
    answers: [
      { key_name: "advance_pct", data_type: "number", extracted_value: "20%" },
      { key_name: "term_months", data_type: "number", extracted_value: "18" },
      { key_name: "warranty_years", data_type: "number", extracted_value: "5" },
      {
        key_name: "total_area_m2",
        data_type: "number",
        extracted_value: "42 800",
      },
    ],
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
  },
  {
    id: id("r002"),
    document_id: id("d001"),
    status: "completed",
    anonymize: true,
    questions: [
      "Какова длина свайного поля по договору, в метрах?",
      "Какая доля субподряда разрешена договором, в процентах?",
    ],
    resolved_schema: [
      { key_name: "pile_field_length", data_type: "number" },
      { key_name: "subcontractor_share", data_type: "number" },
    ],
    answers: [
      {
        key_name: "pile_field_length",
        data_type: "number",
        extracted_value: "560",
      },
      {
        key_name: "subcontractor_share",
        data_type: "number",
        extracted_value: "30%",
      },
    ],
    created_at: daysAgo(4),
    updated_at: daysAgo(4),
  },
  {
    id: id("r020"),
    document_id: id("d020"),
    status: "running",
    anonymize: true,
    questions: [
      "Какой процент аванса предусмотрен договором?",
      "Какой срок выполнения работ в месяцах?",
      "Какова гарантия по договору в годах?",
    ],
    resolved_schema: [
      { key_name: "advance_pct", data_type: "number" },
      { key_name: "term_months", data_type: "number" },
      { key_name: "warranty_years", data_type: "number" },
    ],
    answers: undefined,
    created_at: now(),
    updated_at: now(),
  },
]

// ── Сохранённые сравнения ──────────────────────────────────────────────────

export const MOCK_COMPARISONS: ComparisonSession[] = [
  {
    id: id("cmp1"),
    name: "Сравнение ГП Сити Бей vs ЖК Северный",
    contract_kind: "gp",
    document_ids: [id("d001"), id("d030")],
    document_labels: ["ГП-123 · Сити Бей", "ГП-77 · ЖК Северный"],
    created_at: daysAgo(14),
    created_by_name: "Алексей Демонстратор",
  },
  {
    id: id("cmp2"),
    name: "Условия аванса по портфелю",
    contract_kind: "gp",
    document_ids: [id("d001"), id("d030"), id("d040")],
    document_labels: [
      "ГП-123 · Сити Бей",
      "ГП-77 · ЖК Северный",
      "ГП-12 · Сухаревский",
    ],
    created_at: daysAgo(7),
    created_by_name: "Алексей Демонстратор",
  },
]

// ── История событий объекта ────────────────────────────────────────────────

export const MOCK_SITE_EVENTS: SiteEvent[] = [
  {
    id: id("ev01"),
    site_id: id("0002"),
    kind: "site_created",
    actor_name: "Алексей Демонстратор",
    message: "Создан объект «6-я очередь»",
    occurred_at: daysAgo(90),
  },
  {
    id: id("ev02"),
    site_id: id("0002"),
    kind: "document_uploaded",
    actor_name: "Алексей Демонстратор",
    message: "Загружен договор подряда ГП-123",
    occurred_at: daysAgo(45),
  },
  {
    id: id("ev03"),
    site_id: id("0002"),
    kind: "extraction_started",
    actor_name: "Алексей Демонстратор",
    message: "Запрошены 4 параметра по ГП-123",
    occurred_at: daysAgo(2),
  },
  {
    id: id("ev04"),
    site_id: id("0002"),
    kind: "extraction_completed",
    actor_name: "Система",
    message: "Извлечено 4 параметра по ГП-123",
    occurred_at: daysAgo(2),
  },
  {
    id: id("ev05"),
    site_id: id("0002"),
    kind: "document_uploaded",
    actor_name: "Алексей Демонстратор",
    message: "Загружен договор стройконтроля СК-88",
    occurred_at: daysAgo(30),
  },
  {
    id: id("ev10"),
    site_id: id("0004"),
    kind: "site_created",
    actor_name: "Алексей Демонстратор",
    message: "Создан объект «8-я очередь»",
    occurred_at: daysAgo(15),
  },
  {
    id: id("ev11"),
    site_id: id("0004"),
    kind: "document_uploaded",
    actor_name: "Алексей Демонстратор",
    message: "Загружен договор подряда ГП-145",
    occurred_at: daysAgo(8),
  },
  {
    id: id("ev12"),
    site_id: id("0004"),
    kind: "extraction_started",
    actor_name: "Алексей Демонстратор",
    message: "Запрошены 3 параметра по ГП-145 (выполняется)",
    occurred_at: now(),
  },
]

// ── Список объектов с агрегатами для дашборда ──────────────────────────────

function siteAggregates(siteId: string): {
  contract_kinds: SiteListItem["contract_kinds"]
  extracted_count: number
  last_activity_at: string
} {
  const siteDocs = MOCK_DOCUMENTS.filter((d) => d.site_id === siteId)
  const kinds = Array.from(
    new Set(
      siteDocs
        .filter((d) => d.bundle_id === d.id && d.contract_kind)
        .map((d) => d.contract_kind!),
    ),
  )
  const docIds = siteDocs.map((d) => d.id)
  const extracted = MOCK_EXTRACTED.filter((e) =>
    docIds.includes(e.document_id),
  ).length
  const events = MOCK_SITE_EVENTS.filter((ev) => ev.site_id === siteId)
  const lastEvent = events.sort((a, b) =>
    a.occurred_at < b.occurred_at ? 1 : -1,
  )[0]
  return {
    contract_kinds: kinds.filter(
      (k): k is NonNullable<typeof k> => k !== null && k !== undefined,
    ),
    extracted_count: extracted,
    last_activity_at: lastEvent?.occurred_at ?? daysAgo(30),
  }
}

export const MOCK_SITE_LIST: SiteListItem[] = MOCK_SITES.map((s) => {
  const seed = SITE_SEEDS.find((x) => x.id === s.id)!
  const breadcrumbs = siteBreadcrumbs(s.id).slice(0, -1) // без самого себя
  const agg = siteAggregates(s.id)
  return {
    ...s,
    breadcrumbs,
    contract_kinds: agg.contract_kinds,
    aggregate_status: seed.aggregate_status,
    extracted_count: agg.extracted_count,
    inflation_pct: seed.inflation_pct,
    last_activity_at: agg.last_activity_at,
  }
})

// ── Утилиты выборки, используемые mock-сервисами ──────────────────────────

export function findSiteById(siteId: string): ConstructionSite | undefined {
  return MOCK_SITES.find((s) => s.id === siteId)
}

export function findDocumentById(docId: string): Document | undefined {
  return MOCK_DOCUMENTS.find((d) => d.id === docId)
}

export function listDocumentsForSite(siteId: string): Document[] {
  return MOCK_DOCUMENTS.filter((d) => d.site_id === siteId)
}

export function listAnswersForDocument(docId: string): ExtractedDataItem[] {
  return MOCK_EXTRACTED.filter((e) => e.document_id === docId)
}

export function listExtractionRequestsForDocument(
  docId: string,
): ExtractionRequest[] {
  return MOCK_EXTRACTION_REQUESTS.filter((r) => r.document_id === docId).sort(
    (a, b) => (a.created_at < b.created_at ? 1 : -1),
  )
}

export function listEventsForSite(siteId: string): SiteEvent[] {
  return MOCK_SITE_EVENTS.filter((e) => e.site_id === siteId).sort((a, b) =>
    a.occurred_at < b.occurred_at ? 1 : -1,
  )
}

export function answerForKey(
  docId: string,
  keyId: string,
): ExtractionAnswer | null {
  const item = MOCK_EXTRACTED.find(
    (e) => e.document_id === docId && e.key.id === keyId,
  )
  if (!item) return null
  return {
    key_name: item.key.key_name,
    data_type: item.key.data_type,
    extracted_value: item.extracted_value,
  }
}

export { ORG_ID, USER_ME_ID, USER_PARTNER_ID, siteName, siteBreadcrumbs }
