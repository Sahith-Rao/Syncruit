'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminNavbar from '@/components/admin-navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Mail, User, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Applicant {
  _id: string;
  candidate: {
    _id: string;
    name: string;
    email: string;
  };
  resumeScore: number;
  resumeUrl: string;
  appliedAt: string;
  shortlisted: boolean;
  interviewStatus?: string;
  interviewScore?: number;
}

interface CandidateProfile {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  location?: string;
  currentPosition?: string;
  experience?: string;
  skills?: string;
  summary?: string;
  education?: string;
  certifications?: string;
  resumeUrl?: string;
}

export default function ViewApplications() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [applications, setApplications] = useState<Applicant[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [topN, setTopN] = useState<number>(0);
  const [shortlisting, setShortlisting] = useState(false);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'applications' | 'interviews'>('applications');
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState<null | 'shortlist' | 'select'>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [pendingShortlist, setPendingShortlist] = useState<string[]>([]);
  const [pendingSelect, setPendingSelect] = useState<string[]>([]);
  const [selectedCandidateProfile, setSelectedCandidateProfile] = useState<CandidateProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (jobId) {
      fetch(`${API_URL}/api/applications/job/${jobId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setApplications(data);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch applications", err);
          setIsLoading(false);
        });
    }
  }, [jobId, API_URL]);

  const getScoreColor = (score: number) => {
    if (score > 85) return 'bg-green-100 text-green-800';
    if (score > 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Sorting logic
  const sortedApplications = [...applications].sort((a, b) =>
    sortOrder === 'desc' ? b.resumeScore - a.resumeScore : a.resumeScore - b.resumeScore
  );

  // Top N logic
  const displayedApplications = topN > 0 ? sortedApplications.slice(0, topN) : sortedApplications;

  const openShortlistDialog = () => {
    const applicationIds = topN === 0 ? [] : displayedApplications.map(app => app._id);
    setPendingShortlist(applicationIds);
    setEmailSubject('You have been shortlisted!');
    setEmailBody('Congratulations! You have been shortlisted for the next round. We will contact you soon.');
    setEmailDialogOpen('shortlist');
  };

  const openSelectDialog = () => {
    const applicationIds = displayedInterviewApps.map(app => app._id);
    setPendingSelect(applicationIds);
    setEmailSubject('Congratulations! You have been selected');
    setEmailBody('You have been selected for the next stage. We will contact you soon.');
    setEmailDialogOpen('select');
  };

  const handleShortlist = async (customSubject?: string, customBody?: string) => {
    setShortlisting(true);
    try {
      const applicationIds = pendingShortlist;
      const res = await fetch(`${API_URL}/api/applications/shortlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds, jobId, emailSubject: customSubject, emailBody: customBody })
      });
      const data = await res.json();
      if (res.ok) {
        setShortlistedIds(applicationIds);
        if (data.message !== 'No candidates shortlisted. Selection complete.') {
          alert('Shortlisted and emails sent!');
        }
      } else {
        alert(data.error || 'Failed to shortlist applicants.');
      }
    } catch (err) {
      alert('Failed to shortlist applicants.');
    } finally {
      setShortlisting(false);
      setEmailDialogOpen(null);
    }
  };

  // For Interview Results tab, sort by interviewScore
  const sortedInterviewApps = [...applications]
    .filter(app => typeof app.interviewScore === 'number')
    .sort((a, b) => (b.interviewScore || 0) - (a.interviewScore || 0));
  const displayedInterviewApps = topN > 0 ? sortedInterviewApps.slice(0, topN) : sortedInterviewApps;

  const handleSelectCandidates = async (customSubject?: string, customBody?: string) => {
    setSelecting(true);
    try {
      const applicationIds = pendingSelect;
      const res = await fetch(`${API_URL}/api/applications/select-top`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds, jobId, emailSubject: customSubject, emailBody: customBody })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedIds(applicationIds);
        alert('Candidates selected and emails sent!');
        // Refresh applications
        const refreshed = await fetch(`${API_URL}/api/applications/job/${jobId}`);
        const refreshedData = await refreshed.json();
        if (Array.isArray(refreshedData)) setApplications(refreshedData);
      } else {
        alert(data.error || 'Failed to select candidates.');
      }
    } catch (err) {
      alert('Failed to select candidates.');
    } finally {
      setSelecting(false);
      setEmailDialogOpen(null);
    }
  };

  const handleViewProfile = async (candidateId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/candidates/${candidateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch candidate profile');
      const profileData: CandidateProfile = await res.json();
      setSelectedCandidateProfile(profileData);
      setIsProfileModalOpen(true);
    } catch (error) {
      console.error(error);
      
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
          <div className="mb-6 flex gap-4">
            <Button
              variant={activeTab === 'applications' ? 'default' : 'outline'}
              onClick={() => setActiveTab('applications')}
              className={activeTab === 'applications' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              Applications
            </Button>
            <Button
              variant={activeTab === 'interviews' ? 'default' : 'outline'}
              onClick={() => setActiveTab('interviews')}
              className={activeTab === 'interviews' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              Interview Results
            </Button>
          </div>
          {activeTab === 'applications' && (
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <div className="mt-6" />
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center">
                    <label className="font-medium whitespace-nowrap flex items-center">
                      <span>Select Candidates:</span>
                      <span className="ml-2">Top</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={topN}
                      onChange={e => setTopN(Number(e.target.value))}
                      className="w-10 ml-2"
                    />
                  </div>
                  <Button onClick={openShortlistDialog} className="bg-blue-600 hover:bg-blue-700 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Shortlist Top {topN}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading applications...</p>
                ) : displayedApplications.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Resume Score</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead>Resume</TableHead>
                        <TableHead>Shortlisted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedApplications.map((app) => (
                        <TableRow key={app._id}>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarFallback>{app.candidate?.name?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{app.candidate?.name || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{app.candidate?.email || 'N/A'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getScoreColor(app.resumeScore)}>
                              <Star className="w-3 h-3 mr-1" />
                              {app.resumeScore}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(app.appliedAt), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Resume
                              </a>
                            </Button>
                          </TableCell>
                          <TableCell>
                            {shortlistedIds.includes(app._id) || app.shortlisted ? (
                              <Badge className="bg-green-100 text-green-800">Shortlisted</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">Not Shortlisted</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-8">No applications have been received for this job yet.</p>
                )}
              </CardContent>
            </Card>
          )}
          {activeTab === 'interviews' && (
            <Card>
              <CardHeader>
                <CardTitle>Interview Results</CardTitle>
                <div className="mt-6" />
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center">
                    <label className="font-medium whitespace-nowrap flex items-center">
                      <span>Select Candidates:</span>
                      <span className="ml-2">Top</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={topN}
                      onChange={e => setTopN(Number(e.target.value))}
                      className="w-10 ml-2"
                    />
                  </div>
                  <Button
                    variant="default"
                    disabled={selecting}
                    onClick={openSelectDialog}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Select Top {topN}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Interview Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedInterviewApps.map(app => (
                      <TableRow key={app._id}>
                        <TableCell>{app.candidate?.name || 'N/A'}</TableCell>
                        <TableCell>{app.candidate?.email || 'N/A'}</TableCell>
                        <TableCell>
                          {typeof app.interviewScore === 'number' ? (
                            <Badge className="bg-blue-100 text-blue-800">{app.interviewScore}</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">N/A</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={app.interviewStatus === 'Selected' ? 'bg-green-100 text-green-800' : app.interviewStatus === 'Result Pending' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}>
                            {app.interviewStatus || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProfile(app.candidate._id)}
                            disabled={!app.interviewScore}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Email Dialog for Shortlist/Select */}
      <Dialog open={!!emailDialogOpen} onOpenChange={open => !open && setEmailDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{emailDialogOpen === 'shortlist' ? 'Send Shortlist Email' : 'Send Selection Email'}</DialogTitle>
            <DialogDescription>
              Customize the email subject and message to be sent to the candidates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              placeholder="Email Subject"
              className="w-full"
            />
            <Textarea
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              placeholder="Email Body"
              className="w-full min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (emailDialogOpen === 'shortlist') {
                  void handleShortlist(emailSubject, emailBody);
                } else {
                  void handleSelectCandidates(emailSubject, emailBody);
                }
              }}
              disabled={shortlisting || selecting}
            >
              {emailDialogOpen === 'shortlist' ? (shortlisting ? 'Shortlisting...' : 'Send Shortlist Email') : (selecting ? 'Selecting...' : 'Send Selection Email')}
            </Button>
            <Button variant="outline" onClick={() => setEmailDialogOpen(null)} disabled={shortlisting || selecting}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
            <DialogDescription>
              Details for {selectedCandidateProfile?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCandidateProfile ? (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="font-semibold">Email</p><p>{selectedCandidateProfile.email}</p></div>
                <div><p className="font-semibold">Mobile</p><p>{selectedCandidateProfile.mobile || 'N/A'}</p></div>
                <div><p className="font-semibold">Location</p><p>{selectedCandidateProfile.location || 'N/A'}</p></div>
                <div><p className="font-semibold">Current Position</p><p>{selectedCandidateProfile.currentPosition || 'N/A'}</p></div>
                <div><p className="font-semibold">Experience</p><p>{selectedCandidateProfile.experience || 'N/A'}</p></div>
              </div>
              <div>
                <p className="font-semibold">Skills</p>
                <p>{selectedCandidateProfile.skills || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Summary</p>
                <p className="text-sm text-gray-600">{selectedCandidateProfile.summary || 'N/A'}</p>
              </div>
              <Button asChild>
                <a href={selectedCandidateProfile.resumeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> View Resume
                </a>
              </Button>
            </div>
          ) : (
            <p>Loading profile...</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 