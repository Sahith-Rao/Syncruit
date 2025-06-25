'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/admin-navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Edit,
  Trash2,
  Eye,
  Filter,
  Users,
  Building2,
  ListChecks,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Popover } from '@/components/ui/popover';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  deadline: string;
  createdAt: string;
  applicationCount: number;
  status?: 'Applications Open' | 'Applications Closed' | 'Shortlisted, Interview Pending' | 'Interviews Open' | 'Interviews Closed' | 'Selection Complete';
  interviewStatus?: string;
}

export default function ManageJobs() {
  const [adminData, setAdminData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchField, setSearchField] = useState<'all' | 'title' | 'company' | 'location'>('all');
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
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
    fetchJobs(parsedData._id);
  }, [router]);

  const fetchJobs = (adminId: string) => {
    fetch(`${API_URL}/api/jobs?adminId=${adminId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data);
        }
      })
      .catch(err => {
        console.error("Failed to fetch jobs", err);
        toast.error('Failed to load your jobs. Please try again later.');
      });
  };

  const handleDeleteJob = (jobId: string, jobTitle: string) => {
    toast.success(`Job "${jobTitle}" has been deleted successfully`);
    // Here you would also add the API call to delete the job
    // and then filter it from the local state `setJobs(jobs.filter(j => j._id !== jobId))`
  };

  const handleEditJob = (jobId: string) => {
    toast.info('Edit functionality will be implemented soon');
  };

  const handleViewApplications = (jobId: string) => {
    router.push(`/admin/manage-jobs/${jobId}`);
  };

  const filteredJobs = jobs.filter(job => {
    let matchesSearch = true;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      if (searchField === 'all') {
        matchesSearch =
          job.title.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term) ||
          job.location.toLowerCase().includes(term);
      } else if (searchField === 'title') {
        matchesSearch = job.title.toLowerCase().includes(term);
      } else if (searchField === 'company') {
        matchesSearch = job.company.toLowerCase().includes(term);
      } else if (searchField === 'location') {
        matchesSearch = job.location.toLowerCase().includes(term);
      }
    }
    const matchesStatus = statusFilter ? (job.status === statusFilter) : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applications Open':
        return 'bg-green-100 text-green-800';
      case 'Applications Closed':
        return 'bg-red-100 text-red-800';
      case 'Shortlisted, Interview Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Interviews Open':
        return 'bg-blue-100 text-blue-800';
      case 'Interviews Closed':
        return 'bg-purple-100 text-purple-800';
      case 'Selection Complete':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isJobCompleted = (job: any) => {
    // If any application for this job has interviewStatus 'Selected', mark as Completed
    return job.applications && job.applications.some((app: any) => app.interviewStatus === 'Selected');
  };

  if (!adminData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="text-gray-600 mt-2">View and manage all your job postings</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 w-full">
          <div className="flex flex-wrap items-center gap-3 bg-white/80 border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search jobs by ${searchField === 'all' ? 'title, company, or location' : searchField}`}
                className="pl-10 rounded-full bg-gray-50 border-gray-200 focus:border-blue-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Search Field Segmented Control */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
              {['all', 'title', 'company', 'location'].map(field => (
                <button
                  key={field}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${searchField === field ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setSearchField(field as 'all' | 'title' | 'company' | 'location')}
                  type="button"
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </button>
              ))}
            </div>
            {/* Status Filter */}
            <div className="relative flex items-center">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                className="rounded-full border border-gray-200 pl-9 pr-9 py-2 text-sm bg-gray-50 focus:border-blue-400 appearance-none"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">Status</option>
                <option value="Applications Open">Applications Open</option>
                <option value="Applications Closed">Applications Closed</option>
                <option value="Shortlisted, Interview Pending">Shortlisted, Interview Pending</option>
                <option value="Interviews Open">Interviews Open</option>
                <option value="Interviews Closed">Interviews Closed</option>
                <option value="Selection Complete">Selection Complete</option>
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {/* Reset Filters */}
            {(searchTerm || statusFilter || searchField !== 'all') && (
              <Button
                variant="ghost"
                className="flex items-center gap-1 text-gray-500 hover:text-red-600 px-2"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setSearchField('all');
                }}
              >
                <XCircle className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <Card key={job._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
                        <p className="text-lg text-gray-700 font-medium">{job.company}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={getStatusColor(job.status || 'Applications Open')}>
                          {job.status || 'Applications Open'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {job.salary}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Posted {format(new Date(job.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-500">
                        <Users className="w-4 h-4 mr-1 text-blue-500" />
                        Applications: <span className="font-medium text-blue-600 ml-1">{job.applicationCount}</span>
                      </div>
                      <div className="text-gray-500">
                        Closes: {format(new Date(job.deadline), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:ml-6 mt-4 lg:mt-0">
                    <Button 
                      onClick={() => handleViewApplications(job._id)}
                      variant="outline" 
                      size="sm"
                      className="flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Applications ({job.applicationCount})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">Try adjusting your search terms or create a new job posting</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}