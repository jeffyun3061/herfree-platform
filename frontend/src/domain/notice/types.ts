export type AdminNotice = {
  id: number;
  title: string;
  content: string;
  status: 'ACTIVE' | 'HIDDEN' | 'DELETED';
  sortOrder: number;
  isPinned: boolean;
  createdAt: string;
};
