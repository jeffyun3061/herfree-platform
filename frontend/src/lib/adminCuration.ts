/** 목록에서 이웃 항목과 sortOrder를 교환한다 */
export async function swapSortOrderWithNeighbor<T extends { id: number; sortOrder?: number }>(
  items: T[],
  index: number,
  direction: 'up' | 'down',
  applySortOrder: (id: number, sortOrder: number) => Promise<void>,
): Promise<void> {
  const neighborIndex = direction === 'up' ? index - 1 : index + 1;
  const current = items[index];
  const neighbor = items[neighborIndex];
  if (!current || !neighbor) return;

  const currentOrder = current.sortOrder ?? 0;
  const neighborOrder = neighbor.sortOrder ?? 0;

  await applySortOrder(current.id, neighborOrder);
  await applySortOrder(neighbor.id, currentOrder);
}
