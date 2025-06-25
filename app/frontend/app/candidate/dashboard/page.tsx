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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  jobType?: string;
  experience?: string;
  description: string;
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
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const router = useRouter();

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
    fetchAppliedJobs(parsedData._id);
  }, [router]);

  useEffect(() => {
    fetch('http://localhost:5000/api/jobs/candidate')
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(err => console.error(err));
  }, []);

  const fetchAppliedJobs = (candidateId: string) => {
    fetch(`${API_URL}/api/applications/candidate/${candidateId}`)
      .then(res => res.json())
      .then((applications: any[]) => {
        const jobIds = new Set(applications.map(app => app.job._id.toString()));
        setAppliedJobIds(jobIds);
      })
      .catch(err => console.error('Failed to fetch applications', err));
  };

  const handleApplyClick = (job: Job) => {
    if (appliedJobIds.has(job._id)) {
      toast.error('You have already applied for this job');
      return;
    }
    setSelectedJob(job);
    setIsApplying(true);
  };

  const handleResumeSubmit = async () => {
    if (!resumeFile || !selectedJob || !selectedJob.description) return;

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', selectedJob.description);
    formData.append('candidateId', candidateData._id);
    formData.append('jobId', selectedJob._id);

    try {
      const res = await fetch('http://localhost:5000/api/analyze/resume', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Resume analysis failed');
      }

      const { score, application } = await res.json();

      setAppliedJobIds(prev => new Set(prev).add(application.job));
      if (candidateData?._id) fetchAppliedJobs(candidateData._id);

      const newApplication = {
        jobId: selectedJob._id,
        jobTitle: selectedJob.title,
        company: selectedJob.company,
        appliedDate: new Date().toISOString().split('T')[0],
        status: application?.status || 'Applied',
        score: score,
        applicationId: application?._id,
      };

      const existingApplications = JSON.parse(localStorage.getItem('candidateApplications') || '[]');
      const updatedApplications = [...existingApplications, newApplication];
      localStorage.setItem('candidateApplications', JSON.stringify(updatedApplications));
      
      toast.success(`Successfully applied for ${selectedJob.title}!`);
      setIsApplying(false);
      setResumeFile(null);
      setSelectedJob(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to apply. Please try again.');
    }
  };

  const availableJobs = jobs.filter(job => !appliedJobIds.has(job._id.toString()));

  const filteredJobs = availableJobs.filter(job =>
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
                      onClick={() => handleApplyClick(job)}
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
      <Dialog open={isApplying} onOpenChange={setIsApplying}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Upload your resume to apply for this position. Our AI will analyze it against the job description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
                Resume (PDF)
              </label>
              <Input
                id="resume"
                type="file"
                accept=".pdf"
                onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplying(false)}>Cancel</Button>
            <Button onClick={handleResumeSubmit} disabled={!resumeFile}>
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {openJobId && (
        <Dialog open={!!openJobId} onOpenChange={() => setOpenJobId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{jobs.find(job => job._id === openJobId)?.title}</DialogTitle>
              <DialogDescription>
                {jobs.find(job => job._id === openJobId)?.company}
              </DialogDescription>
            </DialogHeader>
            <div className="mb-2 text-gray-700">
              {jobs.find(job => job._id === openJobId)?.description || 'No description available.'}
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <span><MapPin className="inline w-4 h-4 mr-1" />{jobs.find(job => job._id === openJobId)?.location}</span>
              <span><DollarSign className="inline w-4 h-4 mr-1" />{jobs.find(job => job._id === openJobId)?.salary}</span>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}