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

  const handleShortlist = async () => {
    setShortlisting(true);
    try {
      const applicationIds = displayedApplications.map(app => app._id);
      const res = await fetch(`${API_URL}/api/applications/shortlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds, jobId })
      });
      const data = await res.json();
      if (res.ok) {
        setShortlistedIds(applicationIds);
        alert('Shortlisted and emails sent!');
      } else {
        alert(data.error || 'Failed to shortlist applicants.');
      }
    } catch (err) {
      alert('Failed to shortlist applicants.');
    } finally {
      setShortlisting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Applications for {jobTitle || `Job ID: ${jobId}`}</CardTitle>
            <div className="flex flex-wrap gap-4 mt-4">
              <div>
                <label className="mr-2 font-medium">Sort by Resume Score:</label>
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="border rounded px-2 py-1"
                >
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </select>
              </div>
              <div>
                <label className="mr-2 font-medium">Top N:</label>
                <input
                  type="number"
                  min={0}
                  max={applications.length}
                  value={topN}
                  onChange={e => setTopN(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-20"
                  placeholder="All"
                />
              </div>
              <Button
                variant="default"
                disabled={shortlisting || displayedApplications.length === 0}
                onClick={handleShortlist}
              >
                {shortlisting ? 'Shortlisting...' : 'Shortlist'}
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
                            <AvatarFallback>{app.candidate.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{app.candidate.name}</p>
                            <p className="text-sm text-gray-500">{app.candidate.email}</p>
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
      </div>
    </div>
  );
} 