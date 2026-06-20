export type AdminNotice = {
  id: number;
  title: string;
  content: string;
  status: 'ACTIVE' | 'HIDDEN' | 'DELETED';
  createdAt: string;
};
