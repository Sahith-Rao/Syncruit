'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CandidateNavbar from '@/components/candidate-navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Edit,
  Save,
  Upload,
  Download,
  Plus,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function MyProfile() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [candidateData, setCandidateData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    location: '',
    currentPosition: '',
    experience: '',
    skills: '',
    summary: '',
    education: '',
    certifications: ''
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchCandidateProfile = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        const userId = localStorage.getItem('userId');
        
        if (userType !== 'candidate' || !token || !userId) {
          router.push('/candidate/login');
          return;
        }
        
        const response = await fetch(`${API_URL}/api/candidates/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setCandidateData(data);
        
        // Initialize form with existing data without defaults
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          mobile: data.mobile || '',
          location: data.location || '',
          currentPosition: data.currentPosition || '',
          experience: data.experience || '',
          skills: data.skills || '',
          summary: data.summary || '',
          education: data.education || '',
          certifications: data.certifications || ''
        });
        
        // Initialize skills array from actual data only
        const skillsArray = data.skills ? data.skills.split(',').map((s: string) => s.trim()) : [];
        setSkills(skillsArray);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCandidateProfile();
  }, [router]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Prepare updated data
      const updatedData = {
        ...formData,
        skills: skills.join(', ')
      };
      
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        router.push('/candidate/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/candidates/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const data = await response.json();
      setCandidateData(data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values without defaults
    if (candidateData) {
      setFormData({
        firstName: candidateData.firstName || '',
        lastName: candidateData.lastName || '',
        email: candidateData.email || '',
        mobile: candidateData.mobile || '',
        location: candidateData.location || '',
        currentPosition: candidateData.currentPosition || '',
        experience: candidateData.experience || '',
        skills: candidateData.skills || '',
        summary: candidateData.summary || '',
        education: candidateData.education || '',
        certifications: candidateData.certifications || ''
      });
    }
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  if (!candidateData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CandidateNavbar />
      <div className="pt-16">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-2">Manage your professional information</p>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="bg-purple-600 hover:bg-purple-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Summary Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-12 h-12 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {formData.firstName} {formData.lastName}
                    </h2>
                    <p className="text-gray-600">{formData.currentPosition}</p>
                    <p className="text-sm text-gray-500 flex items-center justify-center mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {formData.location}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-3" />
                      {formData.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-3" />
                      {formData.mobile || 'Not provided'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 mr-3" />
                      {formData.experience} experience
                    </div>
                  </div>

                  {/* Resume buttons removed as requested */}
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2 text-purple-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile</Label>
                      <Input
                        id="mobile"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Professional Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                    Professional Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      name="summary"
                      rows={4}
                      value={formData.summary}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPosition">Current Position</Label>
                      <Input
                        id="currentPosition"
                        name="currentPosition"
                        value={formData.currentPosition}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Technologies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center">
                        {skill}
                        {isEditing && (
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-gray-500 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      />
                      <Button onClick={addSkill} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Education & Certifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
                    Education & Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Textarea
                      id="education"
                      name="education"
                      rows={3}
                      value={formData.education}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certifications">Certifications</Label>
                    <Textarea
                      id="certifications"
                      name="certifications"
                      rows={3}
                      value={formData.certifications}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}