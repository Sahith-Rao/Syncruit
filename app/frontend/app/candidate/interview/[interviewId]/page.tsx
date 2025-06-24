'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CandidateNavbar from '@/components/candidate-navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Lightbulb,
  CheckCircle,
  Star,
  Loader,
  ArrowLeft,
  Save
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
}

interface InterviewResponse {
  question: string;
  userAnswer: string;
  feedback: string;
  rating: number;
}

export default function InterviewPage() {
  const [candidateData, setCandidateData] = useState<any>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const interviewId = params.interviewId as string;

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

  const startSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setUserAnswer('');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setUserAnswer(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast.error('Speech recognition error');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      toast.error('Speech recognition not supported in this browser');
    }
  };

  const stopSpeechRecognition = () => {
    setIsRecording(false);
    // The recognition will stop automatically when we set isRecording to false
  };

  const playQuestion = (question: string) => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(question);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    } else {
      toast.error('Speech synthesis not supported in this browser');
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/interviews/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          question: interview?.questions[currentQuestionIndex].question,
          userAnswer: userAnswer.trim()
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const newResponse: InterviewResponse = {
          question: interview?.questions[currentQuestionIndex].question || '',
          userAnswer: userAnswer.trim(),
          feedback: data.feedback.feedback,
          rating: data.feedback.ratings
        };

        setResponses([...responses, newResponse]);
        setUserAnswer('');
        
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
            <p className="text-gray-600 mt-2">Your interview results and feedback</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{interview.job.title}</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Completed
                </Badge>
              </CardTitle>
              <CardDescription>{interview.job.company}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-2xl font-bold text-gray-900">
                  Overall Rating: {interview.overallRating}/10
                </div>
                <div className="flex">
                  {[...Array(10)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.round(interview.overallRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              {interview.feedback && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Overall Feedback:</h3>
                  <p className="text-gray-700">{interview.feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="0">Question 1</TabsTrigger>
              <TabsTrigger value="1">Question 2</TabsTrigger>
            </TabsList>
            
            {responses.map((response, index) => (
              <TabsContent key={index} value={index.toString()}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Question {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          Rating: {response.rating}/10
                        </Badge>
                        <div className="flex">
                          {[...Array(10)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < response.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Question:</h4>
                      <p className="text-gray-700">{response.question}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Your Answer:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{response.userAnswer}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Feedback:</h4>
                      <p className="text-gray-700 bg-blue-50 p-3 rounded">{response.feedback}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
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

        <Alert className="mb-8 bg-sky-100 border border-sky-200">
          <Lightbulb className="h-5 w-5 text-sky-600" />
          <AlertTitle className="text-sky-800 font-semibold">Important Note</AlertTitle>
          <AlertDescription className="text-sm text-sky-700 mt-1">
            Press "Start Recording" to begin answering the question. Speak clearly and provide detailed responses.
            You can stop recording anytime and re-record if needed.
          </AlertDescription>
        </Alert>

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
              <div className="flex items-center justify-between">
                <p className="text-lg text-gray-700">{currentQuestion.question}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playQuestion(currentQuestion.question)}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
                    variant={isRecording ? "destructive" : "default"}
                    disabled={submitting}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>

                  {userAnswer && (
                    <Button
                      onClick={submitAnswer}
                      disabled={submitting || !userAnswer.trim()}
                    >
                      {submitting ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Submit Answer
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {userAnswer && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Your Answer:</h4>
                    <p className="text-gray-700">{userAnswer}</p>
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