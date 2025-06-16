'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Job {
  id: string;
  title: string;
  location: string;
  salaryRange: string;
  description: string;
}

async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.getIdToken(true); // force refresh
}

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSalaryRange, setEditSalaryRange] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoadingAuth(false);
      if (user) {
        fetchJobs();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getIdToken();
      const res = await fetch('http://localhost:5000/api/admin/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setJobs(data.jobs);
      else setError(data.error || 'Failed to fetch jobs');
    } catch (err) {
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = await getIdToken();
      const res = await fetch('http://localhost:5000/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, location, salaryRange, description })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Job posted successfully!');
        setTitle(''); setLocation(''); setSalaryRange(''); setDescription('');
        fetchJobs();
      } else {
        setError(data.error || 'Failed to post job');
      }
    } catch (err) {
      setError('Failed to post job');
    }
  };

  const startEdit = (job: Job) => {
    setEditingJobId(job.id);
    setEditTitle(job.title);
    setEditLocation(job.location);
    setEditSalaryRange(job.salaryRange);
    setEditDescription(job.description);
  };

  const cancelEdit = () => {
    setEditingJobId(null);
    setEditTitle('');
    setEditLocation('');
    setEditSalaryRange('');
    setEditDescription('');
  };

  const handleEditJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = await getIdToken();
      const res = await fetch(`http://localhost:5000/api/admin/jobs/${editingJobId}` , {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle, location: editLocation, salaryRange: editSalaryRange, description: editDescription })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Job updated successfully!');
        cancelEdit();
        fetchJobs();
      } else {
        setError(data.error || 'Failed to update job');
      }
    } catch (err) {
      setError('Failed to update job');
    }
  };

  const handleDeleteJob = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      const token = await getIdToken();
      const res = await fetch(`http://localhost:5000/api/admin/jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Job deleted successfully!');
        fetchJobs();
      } else {
        setError(data.error || 'Failed to delete job');
      }
    } catch (err) {
      setError('Failed to delete job');
    }
  };

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!firebaseUser) {
    return <div className="min-h-screen flex items-center justify-center">Please log in as admin.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Admin Dashboard</h1>
        <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Post a New Job</h2>
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200">{success}</div>}
          <form onSubmit={handlePostJob} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Range</label>
              <input type="text" value={salaryRange} onChange={e => setSalaryRange(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-gray-700 min-h-[100px]" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-md hover:shadow-lg">Post Job</button>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Your Posted Jobs</h2>
          {loading ? (
            <div>Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-gray-500">No jobs posted yet.</div>
          ) : (
            <ul className="space-y-6">
              {jobs.map(job => (
                <li key={job.id} className="border-b pb-4">
                  {editingJobId === job.id ? (
                    <form onSubmit={handleEditJob} className="space-y-2 mb-2">
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="w-full px-2 py-1 rounded border border-gray-300 text-gray-700" placeholder="Job Title" />
                      <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} required className="w-full px-2 py-1 rounded border border-gray-300 text-gray-700" placeholder="Location" />
                      <input type="text" value={editSalaryRange} onChange={e => setEditSalaryRange(e.target.value)} required className="w-full px-2 py-1 rounded border border-gray-300 text-gray-700" placeholder="Salary Range" />
                      <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} required className="w-full px-2 py-1 rounded border border-gray-300 text-gray-700" placeholder="Description" />
                      <div className="flex gap-2 mt-2">
                        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Save</button>
                        <button type="button" onClick={cancelEdit} className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="font-bold text-lg text-gray-800">{job.title}</div>
                      <div className="text-gray-600">{job.location} | {job.salaryRange}</div>
                      <div className="text-gray-700 mt-2">{job.description}</div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => startEdit(job)} className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500">Edit</button>
                        <button onClick={() => handleDeleteJob(job.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 