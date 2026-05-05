import { CONTRACT_KINDS, type ContractKind } from "@/types/contract"
import { cn } from "@/lib/utils"

interface ContractKindChipProps {
  kind: ContractKind
  short?: boolean
  className?: string
}

export function ContractKindChip({
  kind,
  short = true,
  className,
}: ContractKindChipProps) {
  const meta = CONTRACT_KINDS[kind]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm bg-accent-soft px-2.5 py-1 text-2xs font-medium text-accent-text",
        className,
      )}
    >
      {short ? meta.shortLabel : meta.label}
    </span>
  )
}
