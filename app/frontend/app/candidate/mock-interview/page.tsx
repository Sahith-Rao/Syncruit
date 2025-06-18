'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CandidateNavbar from '@/components/candidate-navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Video, 
  Play, 
  Square, 
  RotateCcw,
  Clock,
  CheckCircle,
  Star,
  Trophy,
  Target,
  Mic,
  Camera,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface InterviewSession {
  id: number;
  type: string;
  duration: string;
  completedDate: string;
  score: number;
  feedback: string;
  status: 'Completed' | 'In Progress' | 'Not Started';
}

export default function MockInterview() {
  const [candidateData, setCandidateData] = useState<any>(null);
  const [selectedType, setSelectedType] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sessions] = useState<InterviewSession[]>([
    {
      id: 1,
      type: 'Technical - Frontend',
      duration: '45 minutes',
      completedDate: '2024-01-25',
      score: 85,
      feedback: 'Strong technical knowledge, good problem-solving approach. Work on explaining complex concepts more clearly.',
      status: 'Completed'
    },
    {
      id: 2,
      type: 'Behavioral',
      duration: '30 minutes',
      completedDate: '2024-01-20',
      score: 78,
      feedback: 'Good storytelling and examples. Practice the STAR method for more structured responses.',
      status: 'Completed'
    },
    {
      id: 3,
      type: 'System Design',
      duration: '60 minutes',
      completedDate: '2024-01-18',
      score: 72,
      feedback: 'Solid understanding of basics. Focus on scalability considerations and trade-offs.',
      status: 'Completed'
    }
  ]);
  const router = useRouter();

  const interviewTypes = [
    { value: 'technical-frontend', label: 'Technical - Frontend', duration: '45 min', questions: 8 },
    { value: 'technical-backend', label: 'Technical - Backend', duration: '45 min', questions: 8 },
    { value: 'behavioral', label: 'Behavioral', duration: '30 min', questions: 6 },
    { value: 'system-design', label: 'System Design', duration: '60 min', questions: 4 },
    { value: 'leadership', label: 'Leadership', duration: '40 min', questions: 7 }
  ];

  const sampleQuestions = {
    'technical-frontend': [
      'Explain the difference between let, const, and var in JavaScript.',
      'How would you optimize the performance of a React application?',
      'Describe the CSS box model and how it affects layout.',
      'What are React hooks and why were they introduced?'
    ],
    'behavioral': [
      'Tell me about a time when you had to work with a difficult team member.',
      'Describe a challenging project you worked on and how you overcame obstacles.',
      'How do you handle tight deadlines and pressure?',
      'Give an example of when you had to learn a new technology quickly.'
    ]
  };

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
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = () => {
    if (!selectedType) {
      toast.error('Please select an interview type first');
      return;
    }
    setIsRecording(true);
    setRecordingTime(0);
    setCurrentQuestion(0);
    toast.success('Recording started! Answer the questions naturally.');
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast.success('Recording stopped! Your interview will be analyzed shortly.');
  };

  const resetInterview = () => {
    setIsRecording(false);
    setRecordingTime(0);
    setCurrentQuestion(0);
    setSelectedType('');
  };

  const nextQuestion = () => {
    const selectedInterview = interviewTypes.find(type => type.value === selectedType);
    if (selectedInterview && currentQuestion < selectedInterview.questions - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (!candidateData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CandidateNavbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mock Interview</h1>
          <p className="text-gray-600 mt-2">Practice your interview skills with AI-powered feedback</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interview Setup & Recording */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="w-5 h-5 mr-2 text-purple-600" />
                  Interview Session
                </CardTitle>
                <CardDescription>
                  Select an interview type and start practicing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isRecording ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interview Type
                        </label>
                        <Select onValueChange={setSelectedType} value={selectedType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose interview type" />
                          </SelectTrigger>
                          <SelectContent>
                            {interviewTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{type.label}</span>
                                  <span className="text-sm text-gray-500 ml-4">
                                    {type.duration} • {type.questions} questions
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedType && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Interview Details</h4>
                          <div className="text-sm text-blue-800 space-y-1">
                            <p>• Duration: {interviewTypes.find(t => t.value === selectedType)?.duration}</p>
                            <p>• Questions: {interviewTypes.find(t => t.value === selectedType)?.questions}</p>
                            <p>• You'll have time to think before answering each question</p>
                            <p>• Speak clearly and maintain eye contact with the camera</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        onClick={startRecording}
                        className="bg-red-600 hover:bg-red-700 flex-1"
                        disabled={!selectedType}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Interview
                      </Button>
                      <Button variant="outline" className="flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Test Camera & Mic
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Recording Interface */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                          <span className="text-red-700 font-medium">Recording</span>
                        </div>
                        <div className="text-red-700 font-mono text-lg">
                          {formatTime(recordingTime)}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-4">
                        <div className="text-center text-white">
                          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm opacity-75">Camera feed would appear here</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <Mic className="w-4 h-4 text-green-500" />
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-2 h-4 rounded ${i < 3 ? 'bg-green-500' : 'bg-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">Audio levels good</span>
                      </div>
                    </div>

                    {/* Current Question */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Question {currentQuestion + 1} of {interviewTypes.find(t => t.value === selectedType)?.questions}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-800 text-lg mb-4">
                          {selectedType === 'technical-frontend' && sampleQuestions['technical-frontend'][currentQuestion] ||
                           selectedType === 'behavioral' && sampleQuestions['behavioral'][currentQuestion] ||
                           'Sample interview question would appear here based on the selected type.'}
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={nextQuestion} variant="outline" size="sm">
                            Next Question
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recording Controls */}
                    <div className="flex gap-4">
                      <Button 
                        onClick={stopRecording}
                        variant="outline"
                        className="flex-1"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop & Submit
                      </Button>
                      <Button onClick={resetInterview} variant="outline">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Previous Sessions & Stats */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sessions Completed</span>
                  <span className="font-semibold">{sessions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className="font-semibold">
                    {Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Best Score</span>
                  <span className="font-semibold text-green-600">
                    {Math.max(...sessions.map(s => s.score))}%
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center text-sm text-gray-600">
                    <Target className="w-4 h-4 mr-2" />
                    Keep practicing to improve!
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{session.type}</h4>
                        <p className="text-sm text-gray-600">{session.duration}</p>
                      </div>
                      <Badge className={getScoreBadgeColor(session.score)}>
                        {session.score}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{session.feedback}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Completed {session.completedDate}</span>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        <span className={getScoreColor(session.score)}>
                          {session.score >= 80 ? 'Excellent' : session.score >= 70 ? 'Good' : 'Needs Work'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}