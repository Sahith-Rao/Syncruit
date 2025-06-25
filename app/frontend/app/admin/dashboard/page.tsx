'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/admin-navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, FileText, TrendingUp, Eye, MapPin, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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

  const checkExpiredInterviews = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/interviews/check-expired');
      const data = await response.json();
      
      if (response.ok) {
        if (data.expiredCount > 0) {
          toast.success(`Processed ${data.expiredCount} expired interviews`);
        } else {
          toast.info('No expired interviews found');
        }
      } else {
        toast.error('Failed to check expired interviews');
      }
    } catch (error) {
      toast.error('Error checking expired interviews');
    }
  };

  const checkJobDeadlines = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/jobs/check-deadlines');
      const data = await response.json();
      
      if (response.ok) {
        if (data.closedCount > 0) {
          toast.success(`Closed ${data.closedCount} job applications`);
        } else {
          toast.info('No jobs past deadline found');
        }
      } else {
        toast.error('Failed to check job deadlines');
      }
    } catch (error) {
      toast.error('Error checking job deadlines');
    }
  };

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

        {/* Recent Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Recent Applications
              </CardTitle>
              <CardDescription>Latest applications received</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-600">{job.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">{job.applications} applications</p>
                      <p className="text-xs text-gray-500">Posted {job.postedDate}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Eye className="w-4 h-4 mr-2" />
                View All Applications
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                Top Performing Jobs
              </CardTitle>
              <CardDescription>Jobs with most applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.sort((a, b) => b.applications - a.applications).map((job, index) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          {job.location}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{job.applications} apps</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {job.salary}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Utility Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
              System Utilities
            </CardTitle>
            <CardDescription>Admin tools for system maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                onClick={checkExpiredInterviews}
                className="flex items-center"
              >
                <Clock className="w-4 h-4 mr-2" />
                Check Expired Interviews
              </Button>
              <Button 
                variant="outline" 
                onClick={checkJobDeadlines}
                className="flex items-center"
              >
                <Clock className="w-4 h-4 mr-2" />
                Check Job Deadlines
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Manually trigger the check for expired interviews. This normally runs automatically every hour.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}