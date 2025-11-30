'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts } from '@/lib/firebase/products';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';
import { Package, ShoppingCart, Users } from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Conta prodotti
      const products = await getProducts();
      
      // Conta ordini
      const ordersRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      
      // Conta utenti (customers)
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('role', '==', 'customer'));
      const usersSnapshot = await getDocs(usersQuery);

      setStats({
        products: products.length,
        orders: ordersSnapshot.size,
        customers: usersSnapshot.size,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="text-center py-12">Caricamento...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-gray-600 mt-2">Benvenuto, {user.email}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Prodotti */}
        <Link href="/admin/products">
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Prodotti</h3>
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.products}</p>
            <p className="text-sm text-gray-600 mt-2">Prodotti attivi nel catalogo</p>
          </div>
        </Link>
        
        {/* Ordini */}
        <Link href="/admin/orders">
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ordini</h3>
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.orders}</p>
            <p className="text-sm text-gray-600 mt-2">Ordini totali ricevuti</p>
          </div>
        </Link>
        
        {/* Clienti */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Clienti</h3>
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.customers}</p>
          <p className="text-sm text-gray-600 mt-2">Utenti registrati</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Azioni rapide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/products/new">
            <button className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <p className="font-semibold">Crea Prodotto</p>
              <p className="text-sm text-gray-600">Aggiungi un nuovo prodotto al catalogo</p>
            </button>
          </Link>
          <Link href="/admin/orders">
            <button className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <p className="font-semibold">Visualizza Ordini</p>
              <p className="text-sm text-gray-600">Gestisci gli ordini ricevuti</p>
            </button>
          </Link>
          <Link href="/admin/products">
            <button className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <p className="font-semibold">Gestisci Prodotti</p>
              <p className="text-sm text-gray-600">Modifica prodotti esistenti</p>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
