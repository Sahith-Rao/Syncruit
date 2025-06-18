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
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  lastDate: string;
  postedDate: string;
  applications: number;
  status: 'Active' | 'Closed' | 'Draft';
}

export default function ManageJobs() {
  const [adminData, setAdminData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs] = useState<Job[]>([
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120,000 - $150,000',
      description: 'We are looking for a senior frontend developer to join our team and work on cutting-edge web applications.',
      lastDate: '2024-02-15',
      postedDate: '2024-01-15',
      applications: 15,
      status: 'Active'
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'InnovateLab',
      location: 'New York, NY',
      salary: '$100,000 - $130,000',
      description: 'Join our product team to drive innovation and deliver exceptional user experiences.',
      lastDate: '2024-02-12',
      postedDate: '2024-01-12',
      applications: 23,
      status: 'Active'
    },
    {
      id: 3,
      title: 'UX Designer',
      company: 'DesignStudio',
      location: 'Austin, TX',
      salary: '$80,000 - $100,000',
      description: 'Create beautiful and intuitive user experiences for our digital products.',
      lastDate: '2024-02-10',
      postedDate: '2024-01-10',
      applications: 8,
      status: 'Active'
    }
  ]);
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

  const handleDeleteJob = (jobId: number, jobTitle: string) => {
    toast.success(`Job "${jobTitle}" has been deleted successfully`);
  };

  const handleEditJob = (jobId: number) => {
    toast.info('Edit functionality will be implemented soon');
  };

  const handleViewApplications = (jobId: number, jobTitle: string) => {
    toast.info(`Viewing applications for "${jobTitle}"`);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-red-100 text-red-800';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jobs by title, company, or location..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
                        <p className="text-lg text-gray-700 font-medium">{job.company}</p>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
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
                        Posted {job.postedDate}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-500">
                        Applications: <span className="font-medium text-blue-600">{job.applications}</span>
                      </div>
                      <div className="text-gray-500">
                        Closes: {job.lastDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:ml-6">
                    <Button 
                      onClick={() => handleViewApplications(job.id, job.title)}
                      variant="outline" 
                      size="sm"
                      className="flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Applications ({job.applications})
                    </Button>
                    <Button 
                      onClick={() => handleEditJob(job.id)}
                      variant="outline" 
                      size="sm"
                      className="flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Job
                    </Button>
                    <Button 
                      onClick={() => handleDeleteJob(job.id, job.title)}
                      variant="outline" 
                      size="sm"
                      className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
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