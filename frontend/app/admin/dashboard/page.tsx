'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface Admin {
  id: string;
  name: string;
  email: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    const token = Cookies.get('admin_token');
    const adminData = localStorage.getItem('admin');
    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }
    setAdmin(JSON.parse(adminData));
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('admin_token');
    localStorage.removeItem('admin');
    router.push('/admin/login');
  };

  if (!admin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4">Welcome, {admin.name}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h2 className="text-2xl font-bold mb-4">Welcome to the Admin Dashboard</h2>
            <p className="text-gray-600">
              This is a protected page for admins only.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 