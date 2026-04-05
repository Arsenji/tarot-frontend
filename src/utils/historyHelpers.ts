export interface HistoryEntryBase {
  type: 'single' | 'three_cards' | 'yes_no';
  category?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  love: 'Любовь',
  career: 'Карьера',
  personal: 'Личное развитие',
  yesno: 'Да/Нет',
  major: 'Старшие Арканы',
  minor: 'Младшие Арканы',
};

export function getCategoryName(category: string | null | undefined): string {
  if (!category) return '';
  return CATEGORY_MAP[category] || category;
}

export function shouldShowCategory(entry: HistoryEntryBase): boolean {
  if (entry.type !== 'three_cards') return false;
  if (!entry.category) return false;
  if (entry.category === 'major' || entry.category === 'minor') return false;
  return true;
}
