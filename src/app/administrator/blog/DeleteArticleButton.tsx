'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export function DeleteArticleButton({ articleId, articleTitle }: { articleId: string; articleTitle: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/${articleId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Error al eliminar');
      }
    } catch (e) {
      alert('Error al eliminar');
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-600">¿Eliminar?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          Sí
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-[#7a6b5d] hover:underline">
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
      title="Eliminar"
    >
      <Trash2 size={16} />
    </button>
  );
}
