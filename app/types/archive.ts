export interface ArchiveCategory {
  id: string
  label: string
  count: number
  icon: string
}

export interface ArchiveItem {
  title: string
  category: string
  code: string
  date: string
  size: string
  type: string
}
