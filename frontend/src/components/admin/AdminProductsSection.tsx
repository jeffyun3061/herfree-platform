'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getErrorMessage } from '@/lib/api/client';
import * as adminApi from '@/lib/api/admin';

const EMPTY_FORM = {
  name: '',
  category: '생활용품',
  imageUrl: '',
  description: '',
  price: '',
  externalUrl: '',
};

export function AdminProductsSection() {
  const { productPage, isLoading, error, refetch } = useProducts(20);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    category: form.category.trim(),
    imageUrl: form.imageUrl.trim() || undefined,
    description: form.description.trim() || undefined,
    price: form.price ? Number(form.price) : undefined,
    externalUrl: form.externalUrl.trim() || undefined,
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const payload = buildPayload();
      if (editingId) {
        await adminApi.updateProduct(editingId, payload);
      } else {
        await adminApi.createProduct(payload);
      }
      resetForm();
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVisibility = async (productId: number, isVisible: boolean) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await adminApi.setProductVisibility(productId, !isVisible);
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (product: (typeof productPage.content)[number]) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      imageUrl: product.imageUrl ?? '',
      description: product.description ?? '',
      price: product.price != null ? String(product.price) : '',
      externalUrl: product.externalUrl ?? '',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-3 font-medium text-cream-foreground">
          {editingId ? '제품 수정' : '제품 등록'}
        </h3>
        <div className="space-y-3">
          <Input
            placeholder="제품명"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            placeholder="카테고리"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          />
          <Input
            placeholder="이미지 URL (선택)"
            value={form.imageUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
          />
          <Input
            placeholder="외부 링크 (선택)"
            value={form.externalUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, externalUrl: e.target.value }))}
          />
          <Input
            placeholder="가격 (선택)"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
          />
          <Textarea
            placeholder="설명 (선택)"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          {actionError && <ErrorMessage message={actionError} />}
          <div className="flex gap-2">
            <Button disabled={isSubmitting} onClick={() => void handleSubmit()}>
              {editingId ? '수정 저장' : '등록'}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={resetForm}>
                취소
              </Button>
            )}
          </div>
        </div>
      </Card>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={getErrorMessage(error)} />}

      <div className="space-y-3">
        {productPage.content.map((product) => (
          <Card key={product.id}>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={product.isVisible ? 'default' : 'muted'}>
                {product.isVisible ? '노출' : '숨김'}
              </Badge>
              <Badge variant="gold">{product.category}</Badge>
            </div>
            <p className="font-medium text-cream-foreground">{product.name}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => startEdit(product)}>
                수정
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => void toggleVisibility(product.id, product.isVisible)}
              >
                {product.isVisible ? '숨기기' : '노출'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
