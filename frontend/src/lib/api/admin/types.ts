export type AdminEventCount = {
  eventName: string;
  count: number;
};

export type AdminStatsOverview = {
  totalUsers: number;
  newUsers7d: number;
  activePosts: number;
  newPosts7d: number;
  activeComments: number;
  pendingReports: number;
  journalRecords: number;
  journalRecords7d: number;
  contents: number;
  videos: number;
  eventsToday: number;
  events7d: number;
  topEvents7d: AdminEventCount[];
};

export type AdminPostUpdateInput = {
  title: string;
  content: string;
};

export type VideoCurationInput = {
  sortOrder?: number;
  isFeatured?: boolean;
  isVisible?: boolean;
};

export type ContentCurationInput = {
  sortOrder?: number;
  isPinned?: boolean;
};

export type NoticeCurationInput = {
  sortOrder?: number;
  isPinned?: boolean;
};

export type AdminCommunityPost = {
  id: number;
  title: string;
  boardName: string;
  status: 'ACTIVE' | 'HIDDEN';
  authorNickname: string;
  createdAt: string;
};

export type AdminCommunityComment = {
  id: number;
  postId: number;
  postTitle: string;
  contentPreview: string;
  status: 'ACTIVE' | 'HIDDEN';
  authorNickname: string;
  createdAt: string;
};

export type AdminModerationStatus = 'ACTIVE' | 'HIDDEN';

export type AdminListQuery = {
  page?: number;
  size?: number;
  keyword?: string;
  status?: AdminModerationStatus;
  category?: string;
  visible?: boolean;
};

export type ContentCreateInput = {
  title: string;
  content: string;
  imageUrl?: string;
  category: string;
  contentType: string;
};

export type ContentUpdateInput = {
  title: string;
  content: string;
  imageUrl?: string;
  category: string;
};

export type VideoCreateInput = {
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  description?: string;
  relatedBoardId?: number;
};

export type VideoUpdateInput = {
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  description?: string;
};

export type ProductCreateInput = {
  name: string;
  category: string;
  imageUrl?: string;
  description?: string;
  price?: number;
  externalUrl?: string;
};

export type ProductUpdateInput = ProductCreateInput;

export type NoticeCreateInput = {
  title: string;
  content: string;
};

export type NoticeUpdateInput = NoticeCreateInput;

export type RestrictUserInput = {
  permanent: boolean;
  days?: number;
  reason: string;
  note?: string;
};
