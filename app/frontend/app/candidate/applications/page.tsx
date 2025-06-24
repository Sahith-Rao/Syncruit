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
  Mic
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
  };
  resumeScore: number;
  appliedAt: string;
  status: 'Applied' | 'Under Review' | 'Interview Scheduled' | 'Rejected' | 'Accepted';
  shortlisted: boolean;
  interviewStatus?: string;
}

export default function MyApplications() {
  const [candidateData, setCandidateData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [openJobId, setOpenJobId] = useState<string | null>(null);

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
    }
  };

  const getStatusColor = (status: string, interviewStatus?: string) => {
    if (interviewStatus === 'Result Pending') return 'bg-orange-100 text-orange-800';
    switch (status) {
      case 'Applied':
        return 'bg-blue-100 text-blue-800';
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Interview Scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Applied':
        return <Clock className="w-4 h-4" />;
      case 'Under Review':
        return <Eye className="w-4 h-4" />;
      case 'Interview Scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'Accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredApplications = applications.filter(app =>
    app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getApplicationStats = () => {
    const total = applications.length;
    const pending = applications.filter(app => ['Applied', 'Under Review'].includes(app.status)).length;
    const interviews = applications.filter(app => app.status === 'Interview Scheduled' || app.shortlisted).length;
    const accepted = applications.filter(app => app.status === 'Accepted').length;
    
    return { total, pending, interviews, accepted };
  };

  const stats = getApplicationStats();

  const getCandidateStatus = (application: Application) => {
    if (!application.shortlisted) {
      return { label: 'Not Qualified', color: 'bg-gray-100 text-gray-800' };
    }
    if (!application.interviewStatus || application.interviewStatus === 'Not Started') {
      return { label: 'Interview Starts Soon', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (application.interviewStatus === 'Result Pending') {
      return { label: 'Result Pending', color: 'bg-orange-100 text-orange-800' };
    }
    if (application.interviewStatus === 'Selected') {
      return { label: 'Selected', color: 'bg-green-100 text-green-800' };
    }
    if (application.interviewStatus === 'Completed') {
      return { label: 'Interview Completed', color: 'bg-blue-100 text-blue-800' };
    }
    return { label: application.status, color: getStatusColor(application.status, application.interviewStatus) };
  };

  if (!candidateData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CandidateNavbar />
      
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

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search applications by job title, company, or location..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filter by Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <div className="space-y-6">
          {filteredApplications.length > 0 ? filteredApplications.map((application) => (
            <Card key={application._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{application.job.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getCandidateStatus(application).color}>
                          {getCandidateStatus(application).label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600 mb-4">
                      <Building className="w-4 h-4 mr-2" />
                      <p>{application.job.company}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{application.job.location}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{application.job.salary}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Applied on {format(new Date(application.appliedAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <Button variant="default" onClick={() => setOpenJobId(application.job._id)}>View Job</Button>
                    {application.shortlisted &&
                      (application.job.interviewStatus === 'Ready' || application.job.interviewStatus === 'Interview Pending') &&
                      (!application.interviewStatus || application.interviewStatus === 'Not Started') && (
                        <Button 
                          variant="outline" 
                          onClick={() => startInterview(application._id)}
                          className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                        >
                          <Mic className="w-4 h-4 mr-2" />
                          Start Interview
                        </Button>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                You have not applied to any jobs yet.
              </CardContent>
            </Card>
          )}
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
                <span><DollarSign className="inline w-4 h-4 mr-1" />{applications.find(app => app.job._id === openJobId)?.job.salary}</span>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}