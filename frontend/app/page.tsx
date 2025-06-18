'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-6">Who&apos;s logging in?</h1>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-md text-lg font-medium hover:bg-indigo-700 transition"
          >
            Candidate
          </button>
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full py-3 px-4 bg-gray-200 text-gray-800 rounded-md text-lg font-medium hover:bg-gray-300 transition"
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}
