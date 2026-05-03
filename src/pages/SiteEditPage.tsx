import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { sitesApi } from "@/services/api/sites"
import { Button } from "@/components/ui-domain/Button"
import { EmptyState } from "@/components/ui-domain/EmptyState"
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/ui-domain/Breadcrumbs"

// Заглушка под редактирование объекта. По IA — модалка поверх /sites/:siteId,
// но роут оставлен как deep-link для прямого перехода.
// Бекенд для PATCH /sites/:id ещё не готов.
export default function SiteEditPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const siteQuery = useQuery({
    queryKey: ["sites", siteId],
    queryFn: () => sitesApi.get(siteId!),
    enabled: !!siteId,
  })

  if (!siteId) return null

  const site = siteQuery.data
  const crumbs: BreadcrumbItem[] = [
    { label: "Объекты", to: "/dashboard" },
    ...(site
      ? [
          { label: site.name, to: `/sites/${site.id}` },
          { label: "Редактирование" },
        ]
      : [{ label: "Редактирование" }]),
  ]

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={crumbs} className="mb-4" />
      <EmptyState
        title="Редактирование скоро будет доступно"
        description="Имя, родитель, статус, обложка — всё это появится здесь, когда будет готов backend (PATCH /api/v1/sites/:id)."
        action={
          <Link to={site ? `/sites/${site.id}` : "/dashboard"}>
            <Button variant="secondary" leftIcon={<ArrowLeft size={14} />}>
              Вернуться к объекту
            </Button>
          </Link>
        }
      />
    </div>
  )
}
