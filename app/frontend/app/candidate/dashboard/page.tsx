'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CandidateNavbar from '@/components/candidate-navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Briefcase,
  Filter,
  Heart,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  requirements: string[];
  postedDate: string;
  lastDate: string;
}

export default function CandidateDashboard() {
  const [candidateData, setCandidateData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs] = useState<Job[]>([
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120,000 - $150,000',
      type: 'Full-time',
      description: 'We are looking for a senior frontend developer to join our team and work on cutting-edge web applications.',
      requirements: ['React', 'TypeScript', 'Next.js', '5+ years experience'],
      postedDate: '2024-01-15',
      lastDate: '2024-02-15'
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'InnovateLab',
      location: 'New York, NY',
      salary: '$100,000 - $130,000',
      type: 'Full-time',
      description: 'Join our product team to drive innovation and deliver exceptional user experiences.',
      requirements: ['Product Management', 'Agile', 'Analytics', '3+ years experience'],
      postedDate: '2024-01-12',
      lastDate: '2024-02-12'
    },
    {
      id: 3,
      title: 'UX Designer',
      company: 'DesignStudio',
      location: 'Austin, TX',
      salary: '$80,000 - $100,000',
      type: 'Full-time',
      description: 'Create beautiful and intuitive user experiences for our digital products.',
      requirements: ['Figma', 'User Research', 'Prototyping', '2+ years experience'],
      postedDate: '2024-01-10',
      lastDate: '2024-02-10'
    },
    {
      id: 4,
      title: 'Backend Developer',
      company: 'DataSystems Co.',
      location: 'Seattle, WA',
      salary: '$110,000 - $140,000',
      type: 'Full-time',
      description: 'Build scalable backend systems and APIs for our growing platform.',
      requirements: ['Node.js', 'Python', 'AWS', '4+ years experience'],
      postedDate: '2024-01-08',
      lastDate: '2024-02-08'
    },
    {
      id: 5,
      title: 'Marketing Specialist',
      company: 'GrowthCo',
      location: 'Remote',
      salary: '$60,000 - $80,000',
      type: 'Full-time',
      description: 'Drive marketing campaigns and grow our brand presence across digital channels.',
      requirements: ['Digital Marketing', 'SEO', 'Content Creation', '2+ years experience'],
      postedDate: '2024-01-05',
      lastDate: '2024-02-05'
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

  const handleApplyJob = (jobId: number, jobTitle: string) => {
    // Get existing applications or initialize empty array
    const existingApplications = JSON.parse(localStorage.getItem('candidateApplications') || '[]');
    
    // Check if already applied
    const alreadyApplied = existingApplications.some((app: any) => app.jobId === jobId);
    
    if (alreadyApplied) {
      toast.error('You have already applied for this job');
      return;
    }
    
    // Add new application
    const newApplication = {
      jobId,
      jobTitle,
      company: jobs.find(job => job.id === jobId)?.company,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Applied'
    };
    
    const updatedApplications = [...existingApplications, newApplication];
    localStorage.setItem('candidateApplications', JSON.stringify(updatedApplications));
    
    toast.success(`Successfully applied for ${jobTitle}!`);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!candidateData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CandidateNavbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {candidateData.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">Discover your next career opportunity</p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jobs, companies, or locations..."
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

        {/* Job Listings */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
                        <p className="text-lg text-gray-700 font-medium">{job.company}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500">
                        <Heart className="w-4 h-4" />
                      </Button>
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
                        <Briefcase className="w-4 h-4 mr-1" />
                        {job.type}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Posted {job.postedDate}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3">{job.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requirements.map((req, index) => (
                        <Badge key={index} variant="secondary">
                          {req}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-sm text-gray-500">
                      Apply by: {job.lastDate}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:ml-6">
                    <Button 
                      onClick={() => handleApplyJob(job.id, job.title)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Apply Now
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
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
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}