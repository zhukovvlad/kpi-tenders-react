import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Building2, PencilLine } from "lucide-react"
import { sitesApi } from "@/services/api/sites"
import { documentsApi } from "@/services/api/documents"
import { siteEventsApi } from "@/services/api/site-events"
import { comparisonsApi } from "@/services/api/comparisons"
import { Button } from "@/components/ui-domain/Button"
import { PageHeader } from "@/components/ui-domain/PageHeader"
import { Tabs, type TabItem } from "@/components/ui-domain/Tabs"
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/ui-domain/Breadcrumbs"
import { useAuth } from "@/hooks/useAuth"
import { ContractsTab } from "@/components/site/ContractsTab"
import { HistoryTab } from "@/components/site/HistoryTab"
import { ComparisonsTab } from "@/components/site/ComparisonsTab"
import { InflationTab } from "@/components/site/InflationTab"
import { AuditTab } from "@/components/site/AuditTab"
import { UploadDocumentDialog } from "@/components/site/UploadDocumentDialog"
import { SiteOverview } from "@/components/site/SiteOverview"
import { formatRelative } from "@/lib/format"
import type { ContractKind } from "@/types/contract"
import type { ConstructionSite } from "@/types/site"

type TabKey = "contracts" | "inflation" | "comparisons" | "history" | "audit"

export default function SitePage() {
  const { siteId } = useParams<{ siteId: string }>()

  // Список сайтов организации нужен и для проверки наличия дочерних, и для
  // построения хлебных крошек по parent_id вверх до корня.
  const sitesListQuery = useQuery({
    queryKey: ["sites", "all"],
    queryFn: sitesApi.list,
  })
  const siteQuery = useQuery({
    queryKey: ["sites", siteId],
    queryFn: () => sitesApi.get(siteId!),
    enabled: !!siteId,
  })

  if (!siteId) return null

  const site = siteQuery.data
  const allSites = sitesListQuery.data ?? []
  const hasChildren = allSites.some((s) => s.parent_id === siteId)
  const breadcrumbs = buildBreadcrumbs(site, allSites)

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={breadcrumbs} className="mb-4" />

      {siteQuery.isLoading || sitesListQuery.isLoading || !site ? (
        <div className="h-32 animate-pulse rounded-lg border border-border-subtle bg-surface" />
      ) : hasChildren ? (
        <SiteOverview site={site} />
      ) : (
        <SiteCardView siteId={siteId} site={site} />
      )}
    </div>
  )
}

interface SiteCardViewProps {
  siteId: string
  site: ConstructionSite
}

// Карточка конечного объекта (без дочерних) — табы и загрузка договоров.
// Вынесено в подкомпонент, чтобы хуки счётчиков для табов поднимались только
// для конечных объектов; для промежуточного экрана они не нужны.
function SiteCardView({ siteId, site }: SiteCardViewProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>("contracts")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadKind, setUploadKind] = useState<ContractKind | undefined>(
    undefined,
  )

  const bundlesQuery = useQuery({
    queryKey: ["sites", siteId, "bundles"],
    queryFn: () => documentsApi.bundlesForSite(siteId),
  })
  const eventsQuery = useQuery({
    queryKey: ["sites", siteId, "events"],
    queryFn: () => siteEventsApi.listForSite(siteId),
  })
  const comparisonsQuery = useQuery({
    queryKey: ["sites", siteId, "comparisons"],
    queryFn: () => comparisonsApi.listForSite(siteId),
  })

  const tabs: TabItem<TabKey>[] = useMemo(
    () => [
      {
        key: "contracts",
        label: "Договоры",
        count: bundlesQuery.data?.length,
      },
      { key: "inflation", label: "Удорожание" },
      {
        key: "comparisons",
        label: "Сравнения",
        count: comparisonsQuery.data?.length,
      },
      { key: "history", label: "История", count: eventsQuery.data?.length },
      ...(user?.role === "admin"
        ? [{ key: "audit" as const, label: "Аудит обработки" }]
        : []),
    ],
    [bundlesQuery.data, comparisonsQuery.data, eventsQuery.data, user?.role],
  )

  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-text"
            aria-hidden
          >
            {site.cover_image_path ? (
              <img
                src={site.cover_image_path}
                alt=""
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <Building2 size={26} />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-2xs uppercase tracking-wider text-fg-tertiary">
              Объект
            </div>
            <PageHeader
              serif
              title={site.name}
              meta={`Создан ${formatRelative(site.created_at)}`}
              className="mt-1"
            />
          </div>
        </div>
        <Link to={`/sites/${siteId}/edit`}>
          <Button variant="secondary" leftIcon={<PencilLine size={14} />}>
            Редактировать
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <Tabs items={tabs} active={activeTab} onChange={setActiveTab} />
        <div className="pt-5">
          {activeTab === "contracts" && (
            <ContractsTab
              siteId={siteId}
              onUpload={(kind) => {
                setUploadKind(kind)
                setUploadOpen(true)
              }}
            />
          )}
          {activeTab === "inflation" && <InflationTab />}
          {activeTab === "comparisons" && <ComparisonsTab siteId={siteId} />}
          {activeTab === "history" && <HistoryTab siteId={siteId} />}
          {activeTab === "audit" && <AuditTab />}
        </div>
      </div>

      {uploadOpen && (
        <UploadDocumentDialog
          siteId={siteId}
          initialKind={uploadKind}
          onClose={() => setUploadOpen(false)}
        />
      )}
    </>
  )
}

// Цепочка от корня до текущего объекта. Включает финальный (некликабельный) сегмент.
function buildBreadcrumbs(
  site: ConstructionSite | undefined,
  allSites: ConstructionSite[],
): BreadcrumbItem[] {
  const root: BreadcrumbItem = { label: "Объекты", to: "/dashboard" }
  if (!site) return [root]

  const byId = new Map(allSites.map((s) => [s.id, s]))
  const chain: ConstructionSite[] = []
  let current: ConstructionSite | undefined = site
  // Защита от циклов на случай некорректных parent_id.
  const visited = new Set<string>()
  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    chain.unshift(current)
    current = current.parent_id ? byId.get(current.parent_id) : undefined
  }

  return [
    root,
    ...chain.map((s, idx) => ({
      label: s.name,
      to: idx === chain.length - 1 ? undefined : `/sites/${s.id}`,
    })),
  ]
}
