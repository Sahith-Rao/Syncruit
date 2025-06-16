'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="bg-white p-10 rounded-xl shadow-lg w-96 transform hover:scale-105 transition-transform duration-300">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Welcome</h1>
        <div className="space-y-4">
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
          >
            Login as Admin
          </button>
          <button
            onClick={() => router.push('/candidate/login')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
          >
            Login as Candidate
          </button>
        </div>
      </div>
    </main>
  );
}
