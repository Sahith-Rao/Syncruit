'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'candidate' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Syncruit</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Where Talent and Hiring Sync Perfectly.
          </p>
        </div>

        {/* Role Selection */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold text-center text-gray-800 mb-12">Choose Your Path</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Admin Card */}
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                selectedRole === 'admin' ? 'ring-2 ring-blue-500 shadow-xl' : ''
              }`}
              onClick={() => setSelectedRole('admin')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800">I'm an Employer</CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Post jobs and find the perfect candidates for your company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    Seamlessly create and manage job listings
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    Analytics and reporting dashboard
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    Manage applications efficiently
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    Instant emails to shortlisted candidates
                  </li>
                </ul>
                {selectedRole === 'admin' && (
                  <div className="space-y-3">
                    <Link href="/admin/login" className="block">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Login as Employer
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/admin/register" className="block">
                      <Button variant="outline" className="w-full">
                        Register as Employer
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Candidate Card */}
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                selectedRole === 'candidate' ? 'ring-2 ring-purple-500 shadow-xl' : ''
              }`}
              onClick={() => setSelectedRole('candidate')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800">I'm a Job Seeker</CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Discover opportunities and advance your career
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    Browse job opportunities
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    Create and manage your profile
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    Track your applications
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    Practice interviews to boost your confidence
                  </li>
                </ul>
                {selectedRole === 'candidate' && (
                  <div className="space-y-3">
                    <Link href="/candidate/login" className="block">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        Login as Job Seeker
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/candidate/register" className="block">
                      <Button variant="outline" className="w-full">
                        Register as Job Seeker
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose Syncruit?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Smart Matching</h4>
              <p className="text-gray-600">Our AI-powered system connects the right talent with the right opportunities.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Easy to Use</h4>
              <p className="text-gray-600">Intuitive interface designed for both employers and job seekers.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Unified Experience</h4>
              <p className="text-gray-600">Discovering talent and finding jobs feels seamless and connected.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}