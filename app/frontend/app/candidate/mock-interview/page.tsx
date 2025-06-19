'use client';

import { useEffect, useState, ChangeEvent, useRef } from 'react';
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
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      let localChunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setRecordedVideo(null);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          localChunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(localChunks, { type: 'video/webm' });
        setRecordedVideo(blob);
        stream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setCurrentQuestion(0);
      toast.success('Recording started! Answer the questions naturally.');
    } catch (err) {
      toast.error('Could not access camera/microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    toast.success('Recording stopped! Your interview will be analyzed shortly.');
  };

  const resetInterview = () => {
    setIsRecording(false);
    setRecordingTime(0);
    setCurrentQuestion(0);
  };

  const nextQuestion = () => {
    // You can implement question navigation logic here if needed, but no type selection
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

  // Upload recorded video and get analysis
  const handleAnalyze = async () => {
    if (!recordedVideo) {
      toast.error('Please record a video first.');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const formData = new FormData();
    formData.append('video', recordedVideo, 'interview.webm');
    try {
      const res = await fetch('http://localhost:5000/api/analyze-interview', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setAnalysisResult(data.analysis);
        toast.success('Analysis complete!');
      } else {
        toast.error(data.error || 'Analysis failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
    setIsAnalyzing(false);
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
                {/* Video recording UI */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Record Interview Video
                  </label>
                  {!isRecording && !recordedVideo && (
                    <Button onClick={startRecording} className="mr-2">
                      Start Recording
                    </Button>
                  )}
                  {isRecording && (
                    <Button onClick={stopRecording} variant="destructive" className="mr-2">
                      Stop Recording
                    </Button>
                  )}
                  {mediaStream && isRecording && (
                    <video ref={videoRef} autoPlay muted className="w-full max-w-md mt-2" />
                  )}
                  {recordedVideo && !isRecording && (
                    <video controls className="w-full max-w-md mt-2">
                      <source src={URL.createObjectURL(recordedVideo)} type="video/webm" />
                    </video>
                  )}
                </div>
                <Button onClick={handleAnalyze} disabled={!recordedVideo || isAnalyzing} className="mt-4">
                  {isAnalyzing ? 'Analyzing...' : 'Submit for Analysis'}
                </Button>
                {analysisResult && (
                  <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-800 mb-4">
                      Overall Score: <span className="font-extrabold">{analysisResult.overall_score}</span>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-lg font-semibold text-green-700 mb-2">Detailed Metrics</h4>
                      <ul className="ml-4 list-disc">
                        {analysisResult.detailed_metrics &&
                          Object.entries(analysisResult.detailed_metrics).map(([metric, value]) => (
                            <li key={metric} className="mb-1">
                              <span className="font-medium capitalize">{metric.replace(/_/g, ' ')}:</span> {String(value)}
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-lg font-semibold text-green-700 mb-2">Feedback Comments</h4>
                      <ul className="ml-4 list-disc">
                        {analysisResult.feedback_comments &&
                          analysisResult.feedback_comments.map((comment: string, idx: number) => (
                            <li key={idx} className="mb-1">{comment}</li>
                          ))}
                      </ul>
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