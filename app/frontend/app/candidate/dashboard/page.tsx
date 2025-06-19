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
  _id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  jobType?: string;
  experience?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  lastDate?: string;
  skillsRequired?: string[];
  createdAt?: string;
}

export default function CandidateDashboard() {
  const [candidateData, setCandidateData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
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

  useEffect(() => {
    fetch('http://localhost:5000/api/jobs')
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(err => console.error(err));
  }, []);

  const handleApplyJob = (jobId: string, jobTitle: string) => {
    const existingApplications = JSON.parse(localStorage.getItem('candidateApplications') || '[]');
    const alreadyApplied = existingApplications.some((app: any) => app.jobId === jobId);
    if (alreadyApplied) {
      toast.error('You have already applied for this job');
      return;
    }
    const newApplication = {
      jobId,
      jobTitle,
      company: jobs.find(job => job._id === jobId)?.company,
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
            <Card key={job._id} className="hover:shadow-lg transition-shadow">
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
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="secondary">
                        <MapPin className="w-4 h-4 mr-1 inline" /> {job.location}
                      </Badge>
                      <Badge variant="secondary">
                        <DollarSign className="w-4 h-4 mr-1 inline" /> {job.salary}
                      </Badge>
                      {job.jobType && (
                        <Badge variant="secondary">
                          <Briefcase className="w-4 h-4 mr-1 inline" /> {job.jobType}
                        </Badge>
                      )}
                      {job.experience && (
                        <Badge variant="secondary">
                          <Calendar className="w-4 h-4 mr-1 inline" /> {job.experience}
                        </Badge>
                      )}
                    </div>
                    {job.skillsRequired && job.skillsRequired.length > 0 && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">Skills Required: </span>
                        {job.skillsRequired.map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="ml-1">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-gray-700 mb-2">{job.description}</p>
                    {job.requirements && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">Requirements: </span>
                        {job.requirements}
                      </div>
                    )}
                    {job.benefits && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">Benefits: </span>
                        {job.benefits}
                      </div>
                    )}
                    {job.lastDate && (
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">Apply By: </span>
                        {job.lastDate}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <Button
                      variant="default"
                      onClick={() => handleApplyJob(job._id, job.title)}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="flex items-center gap-2"
                    >
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        View Details
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}