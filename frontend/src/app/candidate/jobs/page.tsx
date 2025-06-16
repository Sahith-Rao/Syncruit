'use client';

import { useEffect, useState } from 'react';

interface Job {
  id: string;
  title: string;
  location: string;
  salaryRange: string;
  description: string;
}

export default function CandidateJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/candidate/jobs');
      const data = await res.json();
      if (res.ok) setJobs(data.jobs);
      else setError(data.error || 'Failed to fetch jobs');
    } catch (err) {
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Available Jobs</h1>
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">{error}</div>}
          {loading ? (
            <div>Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-gray-500">No jobs available.</div>
          ) : (
            <ul className="space-y-6">
              {jobs.map(job => (
                <li key={job.id} className="border-b pb-4">
                  <div className="font-bold text-lg text-gray-800">{job.title}</div>
                  <div className="text-gray-600">{job.location} | {job.salaryRange}</div>
                  <div className="text-gray-700 mt-2">{job.description}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 