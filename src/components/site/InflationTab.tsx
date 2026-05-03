import { TrendingUp } from "lucide-react"
import { EmptyState } from "@/components/ui-domain/EmptyState"

export function InflationTab() {
  return (
    <EmptyState
      icon={<TrendingUp size={20} />}
      title="Модуль удорожания подключим позднее"
      description="Здесь появится сводка по ценам поставщиков и сравнение с базовым листом материалов из договора. Зона drop-area для счёт-фактур, помесячные графики и пороговые сигналы."
    />
  )
}
