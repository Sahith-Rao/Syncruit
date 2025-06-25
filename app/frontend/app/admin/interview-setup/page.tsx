'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/admin-navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, DollarSign, Building, FileText, Play } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  status: string;
  interviewStatus: string;
  createdAt: string;
}

export default function PostInterview() {
  const [adminData, setAdminData] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [techStack, setTechStack] = useState('');
  const [deadline, setDeadline] = useState('');
  const [posting, setPosting] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const storedAdminData = localStorage.getItem('adminData');
    if (userType !== 'admin' || !storedAdminData) {
      router.push('/admin/login');
      return;
    }
    const parsedData = JSON.parse(storedAdminData);
    setAdminData(parsedData);
    fetchJobs();
  }, [router]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/jobs`);
      const data = await response.json();
      // Only jobs with status 'Shortlisted, Interview Pending' and interviewStatus !== 'Ready'
      const filtered = Array.isArray(data)
        ? data.filter((job: Job) => job.status === 'Shortlisted, Interview Pending' && job.interviewStatus !== 'Ready')
        : [];
      setJobs(filtered);
    } catch (error) {
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setTechStack('');
    setDeadline('');
  };

  const handlePostInterview = async () => {
    if (!selectedJob || !techStack.trim()) {
      toast.error('Please enter the tech stack');
      return;
    }
    if (!deadline) {
      toast.error('Please set the interview deadline');
      return;
    }
    setPosting(true);
    try {
      const response = await fetch(`${API_URL}/api/interviews/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: selectedJob._id, 
          techStack: techStack.trim(),
          deadline: deadline
        })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Interview posted successfully!');
        setSelectedJob(null);
        setTechStack('');
        setDeadline('');
        fetchJobs();
      } else {
        toast.error(data.error || 'Failed to post interview');
      }
    } catch (error) {
      toast.error('Failed to post interview');
    } finally {
      setPosting(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!adminData) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post Interviews</h1>
          <p className="text-gray-600 mt-2">Select a job with status 'Shortlisted, Interview Pending', enter the tech stack, and post the interview. Only shortlisted candidates for that job will see the interview.</p>
        </div>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs by title, company, or location..."
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        {/* Job Selection and Tech Stack Form */}
        {selectedJob ? (
          <Card className="mb-8 border-2 border-blue-200">
            <CardHeader>
              <CardTitle>Setup Interview for {selectedJob.title}</CardTitle>
              <CardDescription>{selectedJob.company} • {selectedJob.location}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="techStack" className="text-sm font-medium">Tech Stack *</label>
                <Input
                  id="techStack"
                  type="text"
                  placeholder="e.g., React, Node.js, MongoDB, TypeScript"
                  value={techStack}
                  onChange={e => setTechStack(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Specify the technologies to focus on for generating interview questions</p>
              </div>
              <div>
                <label htmlFor="deadline" className="text-sm font-medium">Interview Deadline *</label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Set the deadline for candidates to complete the interview</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePostInterview}
                  disabled={posting || !techStack.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {posting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Play className="w-4 h-4 mr-2" />}
                  Post Interview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setSelectedJob(null); setTechStack(''); }}
                  disabled={posting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
                    <p className="mt-1 text-sm text-gray-500">No jobs with status 'Shortlisted, Interview Pending'.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredJobs.map(job => (
                <Card key={job._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectJob(job)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center"><Building className="w-4 h-4 mr-1" />{job.company}</span>
                            <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{job.location}</span>
                            <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1" />{job.salary}</span>
                          </div>
                        </CardDescription>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Shortlisted, Interview Pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600">Posted on {format(new Date(job.createdAt), 'MMM dd, yyyy')}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 