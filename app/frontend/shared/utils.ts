import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Application {
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

// Utility function for calculating candidate statistics
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