'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="text-center py-12">Caricamento...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Crea Nuovo Prodotto</h1>
      <ProductForm />
    </div>
  );
}
