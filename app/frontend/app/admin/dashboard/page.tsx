'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/admin-navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, FileText, TrendingUp, Eye, MapPin, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  applications: number;
  postedDate: string;
}

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [pendingApplications, setPendingApplications] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const storedAdminData = localStorage.getItem('adminData');
    
    if (userType !== 'admin' || !storedAdminData) {
      router.push('/admin/login');
      return;
    }
    
    setAdminData(JSON.parse(storedAdminData));
  }, [router]);

  useEffect(() => {
    // Fetch jobs for this admin
    const storedAdminData = localStorage.getItem('adminData');
    const adminId = storedAdminData ? JSON.parse(storedAdminData)._id : null;
    if (!adminId) return;
    fetch(`http://localhost:5000/api/jobs?adminId=${adminId}`)
      .then(res => res.json())
      .then(data => {
        setJobs(data);
      });
    // Fetch pending applications count from backend
    fetch(`http://localhost:5000/api/applications/admin/${adminId}/pending`)
      .then(res => res.json())
      .then(data => {
        setPendingApplications(data.pending || 0);
      });
  }, []);

  if (!adminData) {
    return <div>Loading...</div>;
  }

  const totalApplications = jobs.reduce((sum, job) => sum + (job.applicationCount || 0), 0);
  const activeJobs = jobs.filter(job => job.status === 'Applications Open').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {adminData.name}!
          </h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your job postings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Jobs Posted</CardTitle>
              <Briefcase className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs.length}</div>
              <p className="text-xs opacity-90">All jobs posted</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Active Jobs</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeJobs}</div>
              <p className="text-xs opacity-90">Currently open for applications</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Applications Received</CardTitle>
              <FileText className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications}</div>
              <p className="text-xs opacity-90">Across all jobs</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Pending Applications</CardTitle>
              <Clock className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApplications}</div>
              <p className="text-xs opacity-90">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Needing Attention & Top Performing Jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Jobs Needing Attention Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Jobs Needing Attention
              </CardTitle>
              <CardDescription>Jobs that require your action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  // Find jobs with pending applications, no applications, or interviews to review
                  const jobsWithPending = jobs.filter((job: any) =>
                    Array.isArray(job.applications) && job.applications.some((app: any) => app.status === 'Applied' || app.status === 'Reviewing')
                  );
                  const jobsWithNoApps = jobs.filter((job: any) => (job.applicationCount || 0) === 0);
                  const jobsWithInterviewsToReview = jobs.filter((job: any) =>
                    Array.isArray(job.applications) && job.applications.some((app: any) =>
                      typeof app.interviewScore === 'number' && (app.status !== 'Selected' && app.status !== 'Not Selected')
                    )
                  );
                  // Merge and deduplicate jobs
                  const jobsNeedingAttention = [
                    ...jobsWithPending.map((job: any) => ({ ...job, attention: 'Pending Applications' as const })),
                    ...jobsWithNoApps.map((job: any) => ({ ...job, attention: 'No Applications' as const })),
                    ...jobsWithInterviewsToReview.map((job: any) => ({ ...job, attention: 'Interviews to Review' as const })),
                  ];
                  // Deduplicate by job._id, but keep the highest priority attention
                  const uniqueJobs: Record<string, any> = {};
                  for (const job of jobsNeedingAttention) {
                    if (!uniqueJobs[job._id]) {
                      uniqueJobs[job._id] = job;
                    } else {
                      // Priority: Pending Applications > Interviews to Review > No Applications
                      const priority = {
                        'Pending Applications': 3,
                        'Interviews to Review': 2,
                        'No Applications': 1,
                      } as const;
                      if (
                        priority[job.attention as keyof typeof priority] >
                        priority[uniqueJobs[job._id].attention as keyof typeof priority]
                      ) {
                        uniqueJobs[job._id] = job;
                      }
                    }
                  }
                  const jobsList = Object.values(uniqueJobs);
                  if (jobsList.length === 0) {
                    return <div className="text-gray-500 text-sm">No jobs need your attention right now.</div>;
                  }
                  return jobsList.map((job: any) => {
                    const attention: 'Pending Applications' | 'No Applications' | 'Interviews to Review' = job.attention;
                    return (
                      <div key={job._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium text-gray-900">{job.title}</span>
                          <span className="ml-2 text-xs text-gray-500">({job.company})</span>
                        </div>
                        <div className="text-right">
                          {attention === 'Pending Applications' && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded">Pending Applications</span>
                          )}
                          {attention === 'No Applications' && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded">No Applications</span>
                          )}
                          {attention === 'Interviews to Review' && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">Interviews to Review</span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Jobs Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                Top Performing Jobs
              </CardTitle>
              <CardDescription>Jobs with the most applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs
                  .filter((job: any) => job.applicationCount > 0)
                  .sort((a: any, b: any) => (b.applicationCount || 0) - (a.applicationCount || 0))
                  .slice(0, 5)
                  .map((job: any, index: number) => (
                    <div key={job._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium text-gray-900">{job.title}</span>
                        <span className="ml-2 text-xs text-gray-500">({job.company})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-blue-700">{job.applicationCount} applications</span>
                      </div>
                    </div>
                  ))}
                {jobs.filter((job: any) => job.applicationCount > 0).length === 0 && (
                  <div className="text-gray-500 text-sm">No jobs with applications yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}