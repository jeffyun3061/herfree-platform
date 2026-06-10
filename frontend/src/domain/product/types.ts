// 제품 응답 (ProductResponse) — 1차 MVP는 외부 구매 링크 큐레이션만 제공한다
export type Product = {
  id: number;
  name: string;
  category: string;
  imageUrl: string | null;
  description: string | null;
  price: number | null;
  externalUrl: string | null;
  clickCount: number;
  isVisible: boolean;
  createdAt: string;
};
