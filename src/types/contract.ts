export type ContractKind =
  | "gp"
  | "construction_control"
  | "finishing"
  | "estimate"
  | "tz"
  | "responsibility_matrix"

export interface ContractKindMeta {
  kind: ContractKind
  label: string
  shortLabel: string
  isContract: boolean
}

export const CONTRACT_KINDS: Record<ContractKind, ContractKindMeta> = {
  gp: { kind: "gp", label: "Генподряд", shortLabel: "ГП", isContract: true },
  construction_control: {
    kind: "construction_control",
    label: "Стройконтроль",
    shortLabel: "Стройконтроль",
    isContract: true,
  },
  finishing: {
    kind: "finishing",
    label: "Отделка",
    shortLabel: "Отделка",
    isContract: true,
  },
  estimate: {
    kind: "estimate",
    label: "Смета",
    shortLabel: "Смета",
    isContract: false,
  },
  tz: {
    kind: "tz",
    label: "Техническое задание",
    shortLabel: "ТЗ",
    isContract: false,
  },
  responsibility_matrix: {
    kind: "responsibility_matrix",
    label: "Матрица ответственности",
    shortLabel: "Матрица",
    isContract: false,
  },
}

export const CONTRACT_KINDS_ORDER: ContractKind[] = [
  "gp",
  "construction_control",
  "finishing",
]
