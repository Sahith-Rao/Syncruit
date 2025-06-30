'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CandidateNavbar from '@/components/candidate-navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Video, 
  Play, 
  Square, 
  RotateCcw,
  Lightbulb,
  CheckCircle,
  Star,
  Loader,
  ArrowLeft,
  Save,
  Camera,
  Send,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  question: string;
  answer: string;
}

interface Interview {
  _id: string;
  job: {
    _id: string;
    title: string;
    company: string;
  };
  questions: Question[];
  status: string;
  overallRating?: number;
  feedback?: string;
  contentScore?: number;
  deliveryScore?: number;
  weightedScore?: number;
}

interface InterviewResponse {
  question: string;
  userAnswer: string;
  feedback: string;
  rating: number;
  videoUrl?: string;
  contentFeedback?: string;
  deliveryFeedback?: string[];
  contentRating?: number;
  deliveryRating?: number;
}

export default function InterviewPage() {
  const [candidateData, setCandidateData] = useState<any>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const interviewId = params.interviewId as string;

  // Video recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Speech recognition states
  const [transcribedAnswer, setTranscribedAnswer] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  
  // Countdown states
  const [countdown, setCountdown] = useState(10);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [recordingTimeLimit] = useState(40);
  const [recordingFailed, setRecordingFailed] = useState(false);
  const [startingInterview, setStartingInterview] = useState(false);
  
  // Analysis states
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Track if the current question has been attempted
  const [questionAttempted, setQuestionAttempted] = useState(false);

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
    fetchInterview();
  }, [router, interviewId]);
  
  // Reset questionAttempted when current question changes
  useEffect(() => {
    setQuestionAttempted(false);
  }, [currentQuestionIndex]);
  
  // Auto-start countdown only when question is first displayed and not attempted
  useEffect(() => {
    if (interview && !isCountingDown && !isRecording && !recordedVideo && !questionAttempted) {
      setCountdown(10);
      setIsCountingDown(true);
      setQuestionAttempted(true); // Mark as attempted so countdown doesn't restart
    }
  }, [interview, currentQuestionIndex, isCountingDown, isRecording, recordedVideo, questionAttempted]);

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
      setStartingInterview(false);
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

  // Abandon interview if user leaves without submitting any answers
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (
        interview &&
        !completed &&
        responses.length === 0 &&
        interviewId
      ) {
        // Send abandon request (fire and forget)
        navigator.sendBeacon(
          `${API_URL}/api/interviews/abandon`,
          JSON.stringify({ interviewId })
        );
        // Optionally show a warning (not always shown in modern browsers)
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also handle React navigation (SPA route change)
      if (
        interview &&
        !completed &&
        responses.length === 0 &&
        interviewId
      ) {
        fetch(`${API_URL}/api/interviews/abandon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interviewId })
        });
      }
    };
  }, [interview, completed, responses.length, interviewId]);

  const fetchInterview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/interviews/${interviewId}`);
      const data = await response.json();
      
      if (response.ok) {
        setInterview(data.interview);
        setResponses(data.responses || []);
        setCompleted(data.interview.status === 'Completed');
      } else {
        toast.error(data.error || 'Failed to fetch interview');
        router.push('/candidate/applications');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      toast.error('Failed to fetch interview');
      router.push('/candidate/applications');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setRecordingFailed(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
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
      setRecordingFailed(true);
      setStartingInterview(false);
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
    toast.success('Recording stopped! Your answer will be analyzed shortly.');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const submitAnswer = async () => {
    if (!recordedVideo) {
      toast.error('Please record a video first.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('video', recordedVideo, 'interview.webm');
      formData.append('interviewId', interviewId);
      formData.append('question', interview?.questions[currentQuestionIndex].question || '');
      formData.append('userAnswer', transcribedAnswer || '');
      
      const response = await fetch(`${API_URL}/api/interviews/submit-answer`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        const newResponse: InterviewResponse = {
          question: interview?.questions[currentQuestionIndex].question || '',
          userAnswer: transcribedAnswer || '',
          feedback: data.contentFeedback || 'No feedback available',
          rating: data.contentRating || 0,
          videoUrl: data.videoUrl || '',
          contentFeedback: data.contentFeedback || '',
          deliveryFeedback: data.deliveryFeedback || [],
          contentRating: data.contentRating || 0,
          deliveryRating: data.deliveryRating || 0
        };

        setResponses([...responses, newResponse]);
        setRecordedVideo(null);
        setTranscribedAnswer('');
        setRecordingTime(0);
        
        toast.success('Answer submitted successfully!');
        
        // Move to next question or complete interview
        if (currentQuestionIndex < (interview?.questions.length || 0) - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          await completeInterview();
        }
      } else {
        toast.error(data.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const completeInterview = async () => {
    try {
      const response = await fetch(`${API_URL}/api/interviews/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCompleted(true);
        setInterview(data.interview);
        toast.success('Interview completed successfully!');
      } else {
        toast.error(data.error || 'Failed to complete interview');
      }
    } catch (error) {
      console.error('Error completing interview:', error);
      toast.error('Failed to complete interview');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading interview...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p>Interview not found</p>
          <Button onClick={() => router.push('/candidate/applications')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CandidateNavbar />
        
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => router.push('/candidate/applications')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Applications
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Interview Completed!</h1>
            <p className="text-gray-600 mt-2">Thank you for completing your interview. Your responses have been submitted for review. Please check your application status for results.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = interview.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <CandidateNavbar />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/candidate/applications')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">AI Interview</h1>
          <p className="text-gray-600 mt-2">{interview.job.title} at {interview.job.company}</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Question {currentQuestionIndex + 1} of {interview.questions.length}</span>
              <Badge className="bg-purple-100 text-purple-800">
                {interview.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-2">Interview Question:</h3>
                <p className="mb-2">{currentQuestion.question}</p>
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
                      <Button onClick={submitAnswer} disabled={submitting} className="flex-1">
                        {submitting ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Answer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    {(!questionAttempted || recordingFailed) && (
                      <>
                        {recordingFailed && (
                          <p className="text-red-600 mb-2">Could not access camera/microphone. Please check your permissions and try again.</p>
                        )}
                        <Button 
                          onClick={() => {
                            setQuestionAttempted(true);
                            setCountdown(10);
                            setIsCountingDown(true);
                            setStartingInterview(true);
                          }} 
                          className="mx-auto"
                          disabled={startingInterview}
                        >
                          {startingInterview ? (
                            <><Loader className="w-4 h-4 mr-2 animate-spin" />Starting...</>
                          ) : (
                            <><Camera className="w-4 h-4 mr-2" />Start Recording</>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {interview.questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full ${
                    index < currentQuestionIndex
                      ? 'bg-green-500'
                      : index === currentQuestionIndex
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {currentQuestionIndex + 1} of {interview.questions.length} questions completed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}