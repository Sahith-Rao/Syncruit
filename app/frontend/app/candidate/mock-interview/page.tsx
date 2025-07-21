'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CandidateNavbar from '@/components/candidate-navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Settings,
  Loader,
  ArrowRight,
  ArrowLeft,
  Send,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

interface InterviewSession {
  id: number;
  type: string;
  duration: string;
  completedDate: string;
  score: number;
  feedback: string;
  question?: string; 
  deliveryFeedback?: string[]; 
  contentScore?: number; 
  deliveryScore?: number; 
  status: 'Completed' | 'In Progress' | 'Not Started';
}

interface Question {
  question: string;
  answer: string;
}

export default function MockInterview() {
  const [candidateData, setCandidateData] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const router = useRouter();
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // State for tracking session modal
  const [modalSessionId, setModalSessionId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New state variables for enhanced functionality
  const [interviewStep, setInterviewStep] = useState<'setup' | 'recording' | 'results'>('setup');
  const [jobTitle, setJobTitle] = useState('');
  const [techStack, setTechStack] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Mid-level');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<Question | null>(null);
  const [transcribedAnswer, setTranscribedAnswer] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [countdown, setCountdown] = useState(10);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [recordingTimeLimit] = useState(40);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Fetch past interview results
  const fetchPastResults = async (candidateId: string) => {
    if (!candidateId) return;
    
    setIsLoadingSessions(true);
    try {
      const response = await fetch(`${API_URL}/api/mock-interviews/results/${candidateId}`);
      const data = await response.json();
      
      if (response.ok && data.results) {
        // Convert the MongoDB results to our InterviewSession format
        const formattedSessions = data.results.map((result: any, index: number) => ({
          id: index + 1,
          type: result.type || 'Technical',
          duration: result.duration || '40 seconds',
          completedDate: new Date(result.completedAt).toLocaleDateString(),
          score: Math.round(result.score),
          feedback: result.feedback || 'No feedback available',
          question: result.question || 'No question available',
          deliveryFeedback: result.deliveryFeedback || [],
          contentScore: result.contentScore || 0,
          deliveryScore: result.deliveryScore || 0,
          status: 'Completed' as const
        }));
        
        setSessions(formattedSessions);
      } else {
        toast.error(data.error || 'Failed to fetch past results');
      }
    } catch (error) {
      toast.error('Network error when fetching past results');
    } finally {
      setIsLoadingSessions(false);
    }
  };
  
  // Save current interview result
  const saveInterviewResult = async (analysisData: any) => {
    if (!candidateData || !analysisData || !generatedQuestion) {
      console.error('Missing required data for saving result:', { 
        hasCandidateData: !!candidateData, 
        hasAnalysisData: !!analysisData, 
        hasGeneratedQuestion: !!generatedQuestion 
      });
      return;
    }
    
    const resultData = {
      candidateId: candidateData._id,
      question: generatedQuestion.question,
      answer: transcribedAnswer,
      score: Math.round(analysisData.weightedScore),
      feedback: analysisData.geminiAnalysis.detailed_results[0]?.feedback,
      contentScore: analysisData.geminiAnalysis.overall_score,
      deliveryScore: analysisData.hrAnalysis.overall_score,
      deliveryFeedback: analysisData.hrAnalysis.feedback_comments?.filter((comment: string) => 
        !comment.toLowerCase().includes('filler word') && 
        !comment.toLowerCase().includes('long pause') &&
        !comment.toLowerCase().includes('speech clarity')
      ) || [],
      videoUrl: analysisData.hrAnalysis.video_url,
      type: `${jobTitle || 'Software Developer'} - ${techStack}`,
      duration: `${recordingTime} seconds`
    };
    
    console.log('Saving interview result with data:', resultData);
    
    try {
      const response = await fetch(`${API_URL}/api/mock-interviews/save-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultData),
      });
      
      console.log('Save result response status:', response.status);
      
      const data = await response.json();
      console.log('Save result response data:', data);
      
      if (response.ok) {
        toast.success('Interview result saved successfully!');
        // Refresh the sessions list
        fetchPastResults(candidateData._id);
      } else {
        console.error('Failed to save result:', data.error);
        toast.error(data.error || 'Failed to save interview result');
      }
    } catch (error) {
      console.error('Network error when saving result:', error);
      toast.error('Network error when saving result');
    }
  };

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const storedCandidateData = localStorage.getItem('candidateData');
    
    if (userType !== 'candidate' || !storedCandidateData) {
      router.push('/candidate/login');
      return;
    }
    
    const parsedData = JSON.parse(storedCandidateData);
    setCandidateData(parsedData);
    
    // Fetch past results when component mounts and candidateData is available
    if (parsedData && parsedData._id) {
      fetchPastResults(parsedData._id);
    }
  }, [router]);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCountingDown && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isCountingDown && countdown === 0) {
      setIsCountingDown(false);
      startRecording();
    }
    return () => clearInterval(interval);
  }, [isCountingDown, countdown]);

  // Recording time limit effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= recordingTimeLimit - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingTimeLimit]);

  const generateQuestion = async () => {
    if (!techStack.trim()) {
      toast.error('Please enter the tech stack');
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const response = await fetch(`${API_URL}/api/mock-interviews/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: jobTitle.trim() || 'Software Developer',
          techStack: techStack.trim(),
          experience: experienceLevel
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.questions && data.questions.length > 0) {
        setGeneratedQuestion(data.questions[0]);
        setInterviewStep('recording');
        toast.success('Question generated successfully!');
        // Start countdown instead of immediately recording
        setCountdown(10);
        setIsCountingDown(true);
      } else {
        toast.error(data.error || 'Failed to generate question');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - SpeechRecognition is not in the TypeScript types
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          setTranscribedAnswer(prevTranscript => prevTranscript + finalTranscript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          toast.error(`Speech recognition error: ${event.error}`);
        };
        
        setRecognition(recognition);
      }
    }
    
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          // Ignore errors when stopping recognition
        }
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      let localChunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setRecordedVideo(null);
      setTranscribedAnswer(''); // Reset transcribed answer
      
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
        
        // Stop speech recognition when recording stops
        if (recognition) {
          try {
            recognition.stop();
          } catch (e) {
            // Ignore errors when stopping recognition
          }
        }
      };
      
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start speech recognition
      if (recognition) {
        try {
          recognition.start();
          toast.success('Recording and speech recognition started! Answer the question naturally.');
        } catch (e) {
          toast.error('Failed to start speech recognition. Your answer may not be transcribed.');
        }
      } else {
        toast.warning('Speech recognition not available in your browser. Your answer may not be analyzed for content.');
      }
    } catch (err) {
      toast.error('Could not access camera/microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    // Stop speech recognition
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        // Ignore errors when stopping recognition
      }
    }
    
    setIsRecording(false);
    toast.success('Recording stopped! Your interview will be analyzed shortly.');
  };

  const resetInterview = () => {
    setIsRecording(false);
    setRecordingTime(0);
    setInterviewStep('setup');
    setGeneratedQuestion(null);
    setRecordedVideo(null);
    setAnalysisResult(null);
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
  
  // Helper function to render Markdown feedback
  const renderMarkdownFeedback = (feedback: string) => {
    if (!feedback) return null;
    
    // Split the feedback into sections based on headings
    const sections = feedback.split(/(?=## )/);
    
    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          // Skip empty sections or Accuracy section
          if (!section.trim() || section.trim().startsWith('## Accuracy')) return null;
          
          // Check if this section has a heading
          const hasHeading = section.startsWith('## ');
          
          if (hasHeading) {
            // Extract heading text
            const headingMatch = section.match(/## ([^\n]+)/);
            const headingText = headingMatch ? headingMatch[1] : '';
            
            // Get content after heading
            const contentAfterHeading = section.replace(/## [^\n]+\n/, '');
            
            // Split content into bullet points
            const bulletPoints = contentAfterHeading
              .split('\n')
              .filter(line => line.trim().startsWith('* '))
              .map(line => line.replace('* ', '').trim());
            
            return (
              <div key={index} className="feedback-section">
                <h3 className="text-md font-semibold text-blue-700 mb-2">{headingText}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {bulletPoints.map((point, i) => (
                    <li key={i} className="text-gray-600">{point}</li>
                  ))}
                </ul>
              </div>
            );
          } else {
            // If no heading, just render as text
            return <p key={index}>{section}</p>;
          }
        })}
      </div>
    );
  };

  // Upload recorded video and get analysis
  const handleAnalyze = async () => {
    if (!recordedVideo) {
      toast.error('Please record a video first.');
      return;
    }
    
    if (!generatedQuestion) {
      toast.error('No question available for analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    const formData = new FormData();
    formData.append('video', recordedVideo, 'interview.webm');
    formData.append('questions', JSON.stringify([generatedQuestion]));
    formData.append('answers', JSON.stringify([transcribedAnswer || 'No transcribed answer available']));
    
    try {
      const res = await fetch(`${API_URL}/api/mock-interviews/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAnalysisResult(data);
        setInterviewStep('results');
        toast.success('Analysis complete!');
        
        // Save the interview result to the database
        if (candidateData && candidateData._id) {
          saveInterviewResult(data);
        }
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
      
      <div className="max-w-7xl mx-auto pt-6 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Practice Interview</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {interviewStep === 'setup' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Interview Setup
                  </CardTitle>
                  <CardDescription>
                    Enter job details to generate a relevant interview question
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g., Frontend Developer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="techStack">Tech Stack</Label>
                    <Input
                      id="techStack"
                      placeholder="e.g., React, Node.js, TypeScript"
                      value={techStack}
                      onChange={(e) => setTechStack(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experienceLevel">Experience Level</Label>
                    <select
                      id="experienceLevel"
                      className="w-full p-2 border rounded-md"
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                    >
                      <option value="Entry-level">Entry-level</option>
                      <option value="Mid-level">Mid-level</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>
                  <Button
                    onClick={generateQuestion}
                    disabled={isGeneratingQuestions}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isGeneratingQuestions ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Generating...
                      </span>
                    ) : (
                      'Generate Interview'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {interviewStep === 'recording' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="w-5 h-5 mr-2 text-purple-600" />
                    Recording Interview
                  </CardTitle>
                  <CardDescription>
                    Answer the question naturally as if in a real interview
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h3 className="font-medium text-lg mb-2">Interview Question:</h3>
                    <p className="mb-2">{generatedQuestion?.question}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Recording Time: {formatTime(recordingTime)}
                      </span>
                      {isRecording && (
                        <Badge className="bg-red-100 text-red-800 animate-pulse">
                          Recording
                        </Badge>
                      )}
                    </div>
                    
                    {isRecording && (
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <h6 className="text-sm font-medium text-gray-700 mb-1">Speech Recognition (Live):</h6>
                        <p className="text-gray-600 text-sm italic">
                          {transcribedAnswer || "Listening for your answer..."}
                        </p>
                      </div>
                    )}

                    {isCountingDown ? (
                      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-4xl font-bold text-purple-600 mb-4">{countdown}</div>
                        <p className="text-gray-600">Recording will start automatically...</p>
                      </div>
                    ) : isRecording ? (
                      <div className="space-y-4">
                        <video ref={videoRef} autoPlay muted className="w-full rounded-lg border" />
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Time Remaining: {formatTime(recordingTimeLimit - recordingTime)}
                          </span>
                        </div>
                        <Button onClick={stopRecording} variant="destructive" className="w-full">
                          <Square className="w-4 h-4 mr-2" />
                          Stop Recording
                        </Button>
                      </div>
                    ) : recordedVideo ? (
                      <div className="space-y-4">
                        <video controls className="w-full rounded-lg border">
                          <source src={URL.createObjectURL(recordedVideo)} type="video/webm" />
                        </video>
                        <div className="flex gap-2">
                          <Button onClick={startRecording} variant="outline" className="flex-1">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Record Again
                          </Button>
                          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1">
                            {isAnalyzing ? (
                              <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit for Analysis
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Your recording will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={resetInterview} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                </CardFooter>
              </Card>
            )}

            {interviewStep === 'results' && analysisResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                    Interview Analysis Results
                  </CardTitle>
                  <CardDescription>
                    Comprehensive feedback from both delivery and content analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-3xl font-bold text-purple-800 mb-2">
                        Overall Score: <span className="font-extrabold">{Math.round(analysisResult.weightedScore)}</span>
                      </div>
                      <p className="text-sm text-purple-600">
                        Based on content (60%), confidence (20%), and speech rate (20%)
                      </p>
                    </div>
                  </div>

                  <Tabs defaultValue="content">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="content">Content Analysis</TabsTrigger>
                      <TabsTrigger value="delivery">Delivery Analysis</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content">
                      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="border border-blue-100 rounded-lg p-4 bg-white">
                          <h5 className="font-medium text-blue-800 mb-2">Interview Question:</h5>
                          <p className="mb-4">{generatedQuestion?.question}</p>
                          
                          {analysisResult.geminiAnalysis.detailed_results[0] && (
                            <div>
                              <div className="flex items-center mb-3">
                                <span className="text-sm font-medium mr-2">Rating:</span>
                                <Badge className={getScoreBadgeColor(analysisResult.geminiAnalysis.detailed_results[0].ratings)}>
                                  {(Math.round(analysisResult.geminiAnalysis.detailed_results[0].ratings * 100) / 100).toFixed(2)}/10
                                </Badge>
                              </div>
                              <div className="text-gray-600 text-sm">
                                {renderMarkdownFeedback(analysisResult.geminiAnalysis.detailed_results[0].feedback)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="delivery">
                      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between p-4 bg-white border border-green-200 rounded-lg shadow-sm mb-6">
                          <div>
                            <h4 className="font-semibold text-gray-700">Delivery Score</h4>
                            <p className="text-xs text-gray-500">Based on confidence and presentation</p>
                          </div>
                          <div className="text-3xl font-bold text-green-700">
                            {((analysisResult.hrAnalysis.overall_score || 0) / 10).toFixed(2)}<span className="text-lg font-normal text-green-500">/10</span>
                          </div>
                        </div>
                        <ul className="ml-4 list-disc">
                          {analysisResult.hrAnalysis.feedback_comments &&
                            analysisResult.hrAnalysis.feedback_comments
                              .filter((comment: string) => 
                                !comment.toLowerCase().includes('filler word') && 
                                !comment.toLowerCase().includes('long pause') &&
                                !comment.toLowerCase().includes('speech clarity')
                              )
                              .map((comment: string, idx: number) => (
                                <li key={idx} className="mb-2 text-gray-700">{comment}</li>
                              ))
                          }
                        </ul>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter>
                  <Button onClick={resetInterview} className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Start New Interview
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          {/* Stats and Previous Sessions */}
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
                    {sessions.length > 0 
                      ? `${Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length)}%` 
                      : 'NA'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Best Score</span>
                  <span className="font-semibold text-green-600">
                    {sessions.length > 0 
                      ? `${Math.max(...sessions.map(s => s.score))}%` 
                      : 'NA'}
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
                {/* Only show the 3 most recent sessions */}
                {sessions.slice(0, 3).map((session) => {
                  return (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div 
                        className="cursor-pointer" 
                        onClick={() => {
                          setModalSessionId(session.id);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{session.type.split(' - ')[0]}</h4>
                          </div>
                          <Badge className={getScoreBadgeColor(session.score)}>
                            {session.score}%
                          </Badge>
                        </div>
                        
                        {/* Only show the question initially */}
                        <p className="text-sm text-gray-700 mb-2 font-medium">
                          {session.question || "Interview question not available"}
                        </p>
                        
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
                    </div>
                  );
                })}
                
                {/* Session Details Modal - Moved outside the map function */}
                {isModalOpen && modalSessionId && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                      <div className="p-6 relative">
                        <button 
                          onClick={() => setIsModalOpen(false)}
                          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        
                        {sessions.find(s => s.id === modalSessionId) && (
                          <>
                            <div className="mb-6">
                              <div className="mb-4">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                  {sessions.find(s => s.id === modalSessionId)?.type}
                                </h2>
                                
                                <div className="p-4 bg-white border border-gray-200 rounded-lg mb-4 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold text-gray-700">Overall Score</h4>
                                      <p className="text-xs text-gray-500">Final evaluation result</p>
                                    </div>
                                    <div className="text-3xl font-bold text-purple-800">
                                      <span className="font-extrabold">{sessions.find(s => s.id === modalSessionId)?.score}%</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Grid layout for scores removed as per feedback */}
                                
                                <div className="text-sm text-gray-600">
                                  <span>Completed {sessions.find(s => s.id === modalSessionId)?.completedDate}</span>
                                </div>
                              </div>
                              
                              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                                <h3 className="font-medium text-lg mb-2">Interview Question:</h3>
                                <p className="mb-2">{sessions.find(s => s.id === modalSessionId)?.question}</p>
                              </div>
                            </div>
                            
                            <Tabs defaultValue="content" className="w-full">
                              <TabsList className="w-full mb-4 grid grid-cols-2 border border-gray-200 rounded-md overflow-hidden h-14 flex items-center">
                                <TabsTrigger value="content" className="text-base h-full flex items-center justify-center data-[state=active]:bg-white data-[state=active]:shadow-none">Content Analysis</TabsTrigger>
                                <TabsTrigger value="delivery" className="text-base h-full flex items-center justify-center data-[state=active]:bg-white data-[state=active]:shadow-none">Delivery Analysis</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="content" className="w-full">
                                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center justify-between p-4 bg-white border border-blue-200 rounded-lg shadow-sm mb-6">
                                    <div>
                                      <h4 className="font-semibold text-gray-700">Content Score</h4>
                                      <p className="text-xs text-gray-500">Based on answer quality and completeness</p>
                                    </div>
                                    <div className="text-3xl font-bold text-blue-700">
                                      {(sessions.find(s => s.id === modalSessionId)?.contentScore || 0).toFixed(2)}<span className="text-lg font-normal text-blue-500">/10</span>
                                    </div>
                                  </div>
                                  <div className="text-gray-600">
                                    {renderMarkdownFeedback(sessions.find(s => s.id === modalSessionId)?.feedback || '')}
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="delivery" className="w-full">
                                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex items-center justify-between p-4 bg-white border border-green-200 rounded-lg shadow-sm mb-6">
                                    <div>
                                      <h4 className="font-semibold text-gray-700">Delivery Score</h4>
                                      <p className="text-xs text-gray-500">Based on confidence and presentation</p>
                                    </div>
                                    <div className="text-3xl font-bold text-green-700">
                                      {((sessions.find(s => s.id === modalSessionId)?.deliveryScore || 0) / 10).toFixed(2)}<span className="text-lg font-normal text-green-500">/10</span>
                                    </div>
                                  </div>
                                  <ul className="ml-4 list-disc">
                                    {sessions.find(s => s.id === modalSessionId)?.deliveryFeedback?.map((comment: string, idx: number) => (
                                      <li key={idx} className="mb-2 text-gray-700">{comment}</li>
                                    ))}
                                  </ul>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}