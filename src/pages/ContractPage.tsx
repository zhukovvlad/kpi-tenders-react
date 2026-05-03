import { Link, useNavigate, useParams } from "react-router-dom"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, GitCompare } from "lucide-react"
import { documentsApi } from "@/services/api/documents"
import { extractionApi } from "@/services/api/extraction"
import { sitesApi } from "@/services/api/sites"
import { CONTRACT_KINDS } from "@/types/contract"
import { Button } from "@/components/ui-domain/Button"
import { PageHeader } from "@/components/ui-domain/PageHeader"
import { ContractKindChip } from "@/components/ui-domain/ContractKindChip"
import { EmptyState } from "@/components/ui-domain/EmptyState"
import { ContractFiles } from "@/components/contract/ContractFiles"
import { ParametersTable } from "@/components/contract/ParametersTable"
import { RequestParameterForm } from "@/components/contract/RequestParameterForm"
import { ExtractionRequestsList } from "@/components/contract/ExtractionRequestsList"
import { formatDateShort } from "@/lib/format"

export default function ContractPage() {
  const { siteId, docId } = useParams<{ siteId: string; docId: string }>()
  const navigate = useNavigate()

  const docQuery = useQuery({
    queryKey: ["documents", docId],
    queryFn: () => documentsApi.get(docId!),
    enabled: !!docId,
  })

  const bundlesQuery = useQuery({
    queryKey: ["sites", siteId, "bundles"],
    queryFn: () => documentsApi.bundlesForSite(siteId!),
    enabled: !!siteId,
  })

  const siteQuery = useQuery({
    queryKey: ["sites", siteId],
    queryFn: () => sitesApi.get(siteId!),
    enabled: !!siteId,
  })

  const answersQuery = useQuery({
    queryKey: ["documents", docId, "answers"],
    queryFn: () => extractionApi.answersForDocument(docId!),
    enabled: !!docId,
  })

  const bundle = useMemo(
    () => bundlesQuery.data?.find((b) => b.root.id === docId),
    [bundlesQuery.data, docId],
  )

  if (!siteId || !docId) return null

  const isLoading = docQuery.isLoading || bundlesQuery.isLoading
  const doc = docQuery.data
  const site = siteQuery.data

  const contractKindLabel =
    bundle?.contract_kind && CONTRACT_KINDS[bundle.contract_kind].label

  return (
    <div className="container-page py-8">
      <Link
        to={`/sites/${siteId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-fg-tertiary transition-colors hover:text-fg"
      >
        <ArrowLeft size={14} /> К объекту {site?.name ? `«${site.name}»` : ""}
      </Link>

      {isLoading || !doc ? (
        <div className="h-32 animate-pulse rounded-lg border border-border-subtle bg-surface" />
      ) : (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-2xs uppercase tracking-wider text-fg-tertiary">
                {bundle && <ContractKindChip kind={bundle.contract_kind} short={false} />}
                {site && <span>· Объект {site.name}</span>}
                <span>· Загружен {formatDateShort(doc.created_at)}</span>
              </div>
              <PageHeader
                serif
                title={doc.display_name ?? doc.file_name}
                subtitle={
                  contractKindLabel
                    ? `Тип: ${contractKindLabel}`
                    : "Документ без указанного типа"
                }
              />
            </div>
            {bundle && (
              <Button
                variant="secondary"
                leftIcon={<GitCompare size={14} />}
                onClick={() =>
                  navigate(
                    `/compare?baseDocId=${docId}&kind=${bundle.contract_kind}`,
                  )
                }
              >
                Сравнить с другими {CONTRACT_KINDS[bundle.contract_kind].shortLabel}
              </Button>
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <section>
                {answersQuery.isLoading ? (
                  <div className="h-32 animate-pulse rounded-lg border border-border-subtle bg-surface" />
                ) : (answersQuery.data ?? []).length === 0 ? (
                  <EmptyState
                    title="Параметры ещё не извлечены"
                    description="Сформулируйте вопрос справа — система определит ключ и достанет значение из договора."
                  />
                ) : (
                  <>
                    <h2 className="mb-2 text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
                      Извлечённые параметры
                    </h2>
                    <ParametersTable items={answersQuery.data ?? []} />
                  </>
                )}
              </section>

              <section>
                <h2 className="mb-2 text-2xs font-medium uppercase tracking-wider text-fg-tertiary">
                  История запросов
                </h2>
                <ExtractionRequestsList
                  documentId={docId}
                  siteId={siteId}
                />
              </section>
            </div>

            <aside className="space-y-4">
              {bundle && <ContractFiles bundle={bundle} />}
              <RequestParameterForm documentId={docId} />
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
