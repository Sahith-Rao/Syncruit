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
  XCircle
} from 'lucide-react';

interface Application {
  id: number;
  jobId: number;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  appliedDate: string;
  status: 'Applied' | 'Under Review' | 'Interview Scheduled' | 'Rejected' | 'Accepted';
  lastUpdate: string;
}

export default function MyApplications() {
  const [candidateData, setCandidateData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [applications] = useState<Application[]>([
    {
      id: 1,
      jobId: 1,
      jobTitle: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120,000 - $150,000',
      appliedDate: '2024-01-20',
      status: 'Under Review',
      lastUpdate: '2024-01-22'
    },
    {
      id: 2,
      jobId: 2,
      jobTitle: 'Product Manager',
      company: 'InnovateLab',
      location: 'New York, NY',
      salary: '$100,000 - $130,000',
      appliedDate: '2024-01-18',
      status: 'Interview Scheduled',
      lastUpdate: '2024-01-25'
    },
    {
      id: 3,
      jobId: 3,
      jobTitle: 'UX Designer',
      company: 'DesignStudio',
      location: 'Austin, TX',
      salary: '$80,000 - $100,000',
      appliedDate: '2024-01-15',
      status: 'Applied',
      lastUpdate: '2024-01-15'
    },
    {
      id: 4,
      jobId: 4,
      jobTitle: 'Backend Developer',
      company: 'DataSystems Co.',
      location: 'Seattle, WA',
      salary: '$110,000 - $140,000',
      appliedDate: '2024-01-10',
      status: 'Rejected',
      lastUpdate: '2024-01-24'
    },
    {
      id: 5,
      jobId: 5,
      jobTitle: 'Marketing Specialist',
      company: 'GrowthCo',
      location: 'Remote',
      salary: '$60,000 - $80,000',
      appliedDate: '2024-01-08',
      status: 'Accepted',
      lastUpdate: '2024-01-26'
    }
  ]);
  const router = useRouter();

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const storedCandidateData = localStorage.getItem('candidateData');
    
    if (userType !== 'candidate' || !storedCandidateData) {
      router.push('/candidate/login');
      return;
    }
    
    setCandidateData(JSON.parse(storedCandidateData));
  }, [router]);

  const getStatusColor = (status: string) => {
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
    app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getApplicationStats = () => {
    const total = applications.length;
    const pending = applications.filter(app => ['Applied', 'Under Review'].includes(app.status)).length;
    const interviews = applications.filter(app => app.status === 'Interview Scheduled').length;
    const accepted = applications.filter(app => app.status === 'Accepted').length;
    
    return { total, pending, interviews, accepted };
  };

  const stats = getApplicationStats();

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
          {filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{application.jobTitle}</h3>
                        <div className="flex items-center text-lg text-gray-700 font-medium">
                          <Building className="w-4 h-4 mr-1" />
                          {application.company}
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(application.status)} flex items-center`}>
                        {getStatusIcon(application.status)}
                        <span className="ml-1">{application.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {application.location}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {application.salary}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Applied {application.appliedDate}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      Last updated: {application.lastUpdate}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:ml-6">
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      View Job Details
                    </Button>
                    {application.status === 'Interview Scheduled' && (
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        View Interview Details
                      </Button>
                    )}
                    {application.status === 'Accepted' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        View Offer Details
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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
      </div>
    </div>
  );
}