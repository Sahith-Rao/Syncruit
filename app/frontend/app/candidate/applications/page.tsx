'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CandidateNavbar from '@/components/candidate-navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Building,
  FileText,
  Eye,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  BarChart,
  Play,
  Mic,
  Wallet,
  Loader
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Application {
  _id: string;
  job: {
    _id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    description: string;
    interviewStatus?: string;
    status?: string;
  };
  resumeScore: number;
  appliedAt: string;
  status: 'Applied' | 'Shortlisted' | 'Not Qualified' | 'Reviewing' | 'Interview Expired' | 'Selected' | 'Not Selected';
  shortlisted: boolean;
  interviewStatus?: string;
}

// Exported utility for use in dashboard and applications page
export function getCandidateStats(applications: Application[]) {
  // Total applications
  const total = applications.length;

  // Pending review: Applied, Shortlisted, Reviewing
  const pending = applications.filter(app =>
    app.status === 'Applied' || app.status === 'Shortlisted' || app.status === 'Reviewing'
  ).length;

  // Interviews: where Start Interview button would be visible
  const interviews = applications.filter(app =>
    app.shortlisted &&
    (app.job.interviewStatus === 'Ready' || app.job.status === 'Interviews Open') &&
    (!app.interviewStatus || app.interviewStatus === 'Not Started') &&
    app.status !== 'Reviewing' &&
    app.status !== 'Not Selected' &&
    app.status !== 'Interview Expired'
  ).length;

  // Accepted: Selected
  const accepted = applications.filter(app => app.status === 'Selected').length;

  return { total, pending, interviews, accepted };
}

export default function MyApplications() {
  const [candidateData, setCandidateData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'title' | 'company' | 'location'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [startingInterviewId, setStartingInterviewId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const storedCandidateData = localStorage.getItem('candidateData');
    
    if (userType !== 'candidate' || !storedCandidateData) {
      router.push('/candidate/login');
      return;
    }
    
    const parsedData = JSON.parse(storedCandidateData);
    setCandidateData(parsedData);
    fetchApplications(parsedData._id);
  }, [router]);

  const fetchApplications = (candidateId: string) => {
    fetch(`${API_URL}/api/applications/candidate/${candidateId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setApplications(data);
        }
      })
      .catch(err => console.error("Failed to fetch applications", err));
  };

  const startInterview = async (applicationId: string) => {
    setStartingInterviewId(applicationId);
    try {
      const response = await fetch(`${API_URL}/api/interviews/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Interview started successfully!');
        router.push(`/candidate/interview/${data.interview._id}`);
      } else {
        toast.error(data.error || 'Failed to start interview');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error('Failed to start interview');
    } finally {
      setStartingInterviewId(null);
    }
  };

  const getStatusColor = (status: string, interviewStatus?: string) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-100 text-blue-800';
      case 'Shortlisted':
        return 'bg-green-100 text-green-800';
      case 'Not Qualified':
        return 'bg-red-100 text-red-800';
      case 'Reviewing':
        return 'bg-orange-100 text-orange-800';
      case 'Interview Expired':
        return 'bg-gray-100 text-gray-800';
      case 'Selected':
        return 'bg-green-100 text-green-800';
      case 'Not Selected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Applied':
        return <Clock className="w-4 h-4" />;
      case 'Shortlisted':
        return <CheckCircle className="w-4 h-4" />;
      case 'Not Qualified':
        return <XCircle className="w-4 h-4" />;
      case 'Reviewing':
        return <Eye className="w-4 h-4" />;
      case 'Interview Expired':
        return <XCircle className="w-4 h-4" />;
      case 'Selected':
        return <CheckCircle className="w-4 h-4" />;
      case 'Not Selected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredApplications = applications.filter(app => {
    let matchesSearch = true;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      if (searchField === 'all') {
        matchesSearch =
          app.job.title.toLowerCase().includes(term) ||
          app.job.company.toLowerCase().includes(term) ||
          app.job.location.toLowerCase().includes(term);
      } else if (searchField === 'title') {
        matchesSearch = app.job.title.toLowerCase().includes(term);
      } else if (searchField === 'company') {
        matchesSearch = app.job.company.toLowerCase().includes(term);
      } else if (searchField === 'location') {
        matchesSearch = app.job.location.toLowerCase().includes(term);
      }
    }
    const matchesStatus = statusFilter ? (app.status === statusFilter) : true;
    return matchesSearch && matchesStatus;
  });

  const stats = getCandidateStats(applications);

  const getCandidateStatus = (application: Application) => {
    return { 
      label: application.status, 
      color: getStatusColor(application.status, application.interviewStatus) 
    };
  };

  if (!candidateData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CandidateNavbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600 mt-2">Track the status of your job applications</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Applications</CardTitle>
                <FileText className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs opacity-90">Jobs applied to</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Pending Review</CardTitle>
                <Clock className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs opacity-90">Awaiting response</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Interviews</CardTitle>
                <Calendar className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.interviews}</div>
                <p className="text-xs opacity-90">Scheduled</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Accepted</CardTitle>
                <CheckCircle className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.accepted}</div>
                <p className="text-xs opacity-90">Job offers</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 w-full">
            <div className="flex flex-wrap items-center gap-3 bg-white/80 border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search by ${searchField === 'all' ? 'title, company, or location' : searchField}`}
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
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${searchField === field ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
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
                  <option value="">Filter by Status</option>
                  <option value="Applied">Applied</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Not Qualified">Not Qualified</option>
                  <option value="Reviewing">Reviewing</option>
                  <option value="Interview Expired">Interview Expired</option>
                  <option value="Selected">Selected</option>
                  <option value="Not Selected">Not Selected</option>
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

          {/* Applications List */}
          <div className="space-y-6">
            {filteredApplications.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-xl border border-gray-200 p-7 min-h-[170px] flex flex-col gap-3 shadow-sm"
              >
                <div className="flex flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-1">{app.job.title}</h3>
                    <div className="text-gray-600 mt-0.5 mb-1 text-sm md:text-base line-clamp-3">
                      {app.job.description}
                    </div>
                  </div>
                  <span className={"px-3 py-1 rounded-full text-xs font-semibold mt-1 ml-4 min-w-[80px] text-center flex items-center justify-center " + getStatusColor(app.status, app.interviewStatus)}>
                    {app.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-6 text-gray-600 mt-3 text-sm md:text-base">
                  <span className="flex items-center gap-1"><Building className="w-4 h-4" />{app.job.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{app.job.location}</span>
                  <span className="flex items-center gap-1"><Wallet className="w-4 h-4" />{app.job.salary}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Applied on {format(new Date(app.appliedAt), 'MMM d, yyyy')}</span>
                </div>
                
                {/* Start Interview Button */}
                {app.shortlisted &&
                 (app.job.interviewStatus === 'Ready' || app.job.status === 'Interviews Open') &&
                 (!app.interviewStatus || app.interviewStatus === 'Not Started') &&
                 app.status !== 'Reviewing' &&
                 app.status !== 'Not Selected' &&
                 app.status !== 'Interview Expired' && (
                  <div className="mt-4">
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                      onClick={() => startInterview(app._id)}
                      disabled={startingInterviewId === app._id}
                    >
                      {startingInterviewId === app._id ? (
                        <><Loader className="w-4 h-4 animate-spin" />Starting...</>
                      ) : (
                        <><Play className="w-4 h-4" />Start Interview</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredApplications.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600 mb-4">You haven't applied to any jobs yet or no applications match your search</p>
                <Button onClick={() => router.push('/candidate/dashboard')}>
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          )}

          {openJobId && (
            <Dialog open={!!openJobId} onOpenChange={() => setOpenJobId(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{applications.find(app => app.job._id === openJobId)?.job.title}</DialogTitle>
                  <DialogDescription>
                    {applications.find(app => app.job._id === openJobId)?.job.company}
                  </DialogDescription>
                </DialogHeader>
                <div className="mb-2 text-gray-700">
                  {applications.find(app => app.job._id === openJobId)?.job.description || 'No description available.'}
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span><MapPin className="inline w-4 h-4 mr-1" />{applications.find(app => app.job._id === openJobId)?.job.location}</span>
                  <span><Wallet className="inline w-4 h-4 mr-1" />{applications.find(app => app.job._id === openJobId)?.job.salary}</span>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}