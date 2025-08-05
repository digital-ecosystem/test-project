'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Question, UserUpdate } from '@/types';
import { generatePDF } from '@/utils/pdfGenerator';
import { useParams, useRouter } from 'next/navigation';
import { SessionStatus } from '@/generated/prisma';

const Phase = () => {
    const params = useParams();
    const sessionId = params?.sessionId as string;
    console.log("🚀 ~ Phase ~ sessionId:", sessionId)
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [showPhase2, setShowPhase2] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<UserUpdate>({
        first_name: '',
        last_name: '',
        age: 0
    });
    // const [sessionId, setSessionId] = useState<string | null>(null);
    const router = useRouter();
    const [pdfPath, setPdfPath] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [qaSessionStatus, setQaSessionStatus] = useState<string | null>(SessionStatus.DRAFT);

    useEffect(() => {
        console.log(" qaSessionStatus : ", qaSessionStatus)
    }, [qaSessionStatus]);

    // Mock data for demonstration - replace with your API call
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await fetch('/api/phase?id=' + sessionId, {
                    method: 'GET',
                });
                const data = await response.json();
                if (data?.success) {
                    setQuestions(data.questions);
                    setAnswers(data.answers || {});
                } else {
                    setQuestions([]);
                    router.push('/customer/signin')
                }
            } catch (error) {
                console.error('Error fetching questions:', error);
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, []);

    // Fetch user info
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await fetch('/api/user/info/' + sessionId, {
                    method: 'GET',
                });
                const data = await response.json();
                if (data?.success) {
                    setUserInfo((prev) => ({
                        ...prev,
                        first_name: data.user?.firstName || '',
                        last_name: data.user?.lastName || '',
                        age: data.user?.age || 0
                    } as UserUpdate));
                    setQaSessionStatus(data.user?.qaSession?.status || SessionStatus.DRAFT);
                } else {
                    console.error('Error fetching user info:', data.message);
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };

        fetchUserInfo();
    }, []);

    const handleOptionSelect = async (questionId: string, optionValue: string) => {
        const newAnswers = { ...answers, [questionId]: optionValue };
        setAnswers(newAnswers);

        // Persist answer immediately (optimistic update)
        try {
            await fetch('/api/answers?id=' + sessionId, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionId,
                    answer: optionValue
                })
            });
        } catch (error) {
            console.error('Error saving answer:', error);
        }

        // Auto-advance to next question
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                // All questions completed, move to Phase 2
                setShowPhase2(true);
            }
        }, 300);
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setShowPhase2(true);
        }
    };

    const handlePhase2Submit = async () => {

        // Validate user info
        if (!userInfo.first_name || !userInfo.last_name || !userInfo.age) {
            setError('Please fill in all fields before proceeding.');
            return;
        }

        // Age validation accepts 18-100
        if (userInfo.age < 18 || userInfo.age > 100) {
            setError('Please enter a valid age between 18 and 100.');
            return;
        }

        // Minimum 2 and Maximum characters for first and last name
        if (userInfo.first_name.length < 2 || userInfo.last_name.length < 2
            || userInfo.first_name.length > 30 || userInfo.last_name.length > 30) {
            setError('First and last name must be between 2 and 30 characters.');
            return;
        }

        // First and last name validation
        const namePattern = /^[A-Za-z]+([ '-][A-Za-z]+)*$/;
        if (!namePattern.test(userInfo.first_name) || !namePattern.test(userInfo.last_name)) {
            setError('First and last name can only contain letters and spaces.');
            return;
        }

        // update user info
        try {
            await fetch('/api/user/update?id=' + sessionId, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInfo)
            });

            const pdf = await generatePDF(questions, answers, userInfo, 'A loan processor is a professional responsible for thoroughly examining loan applications, assessing credit standings, and finalizing loan contracts. They play an intermediary role between clients and financial institutions, ensuring timely loan approvals and protecting the organization’s credibility. With expertise in banking procedures and regulations, they analyze applicants’ eligibility and develop repayment plans while maintaining strong communication and sales skills. A loan processor acts as a key link in facilitating loan approvals and maintaining customer satisfaction.');
            // const pdf = await generatePDFFromHTML(questions, userInfo, 'A loan processor is a professional responsible for thoroughly examining loan applications, assessing credit standings, and finalizing loan contracts. They play an intermediary role between clients and financial institutions, ensuring timely loan approvals and protecting the organization’s credibility. With expertise in banking procedures and regulations, they analyze applicants’ eligibility and develop repayment plans while maintaining strong communication and sales skills. A loan processor acts as a key link in facilitating loan approvals and maintaining customer satisfaction.');

            // Save the PDF
            const fileName = `session-${sessionId}.pdf`;

            // pdf.save(fileName);

            // You can also convert to blob for upload to server
            const pdfBlob = pdf.output('blob');
            // uploadPDFToServer(pdfBlob);

            const arrayBuffer = await pdfBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const pdfSave = await fetch('/api/phase/save-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, pdfBase64: buffer })
            });
            const pdfSaveResponse = await pdfSave.json();
            if (pdfSaveResponse?.success) {
                setPdfPath(process.env.NEXT_PUBLIC_FRONTEND_URL + pdfSaveResponse.fileUrl);
            } else {
                alert('Error saving PDF');
                setPdfPath('')
            }

        } catch (error) {
            console.error('Error updating user info:', error);
        }

    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading questions...</p>
                </div>
            </div>
        );
    }

    if (pdfPath) {
        return (
            // Display full screen
            <div className="flex flex-col items-center justify-center h-screen w-full">
                <div className="bg-white p-4 rounded-lg shadow-md w-full h-full">
                    {/* Load PDF in pdf viewer or Iframe */}
                    <div className="flex flex-col justify-center w-full h-full">
                        {/* Complete and Signature Button and Back to Dashboard Button */}
                        <iframe src={pdfPath} width="100%" height="100%" frameBorder="0" scrolling="no" />
                        {/* Response summary */}
                        <div className="flex justify-between w-full mt-4">
                            <button
                                onClick={() => router.push('/customer/dashboard')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                            {/* <button
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <a href={pdfPath} download={'session-' + sessionId + '.pdf'}>
                                    Download PDF
                                </a>
                            </button> */}
                            <button
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    // 1. Call your API to update user status
                                    try {
                                        await fetch('/api/user/update-status', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ sessionId }),
                                        });
                                    } catch (err) {
                                        console.error('Failed to update user status', err);
                                    }
                                    // 2. Trigger the download
                                    const link = document.createElement('a');
                                    link.href = pdfPath;
                                    link.download = 'session-' + sessionId + '.pdf';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            >
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (showPhase2) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
                        <p className="text-gray-600">Please provide your details to continue</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your first name"
                                value={userInfo.first_name || ''}
                                onChange={(e) => setUserInfo({ ...userInfo, first_name: e.target.value })}
                                disabled={qaSessionStatus !== SessionStatus.DRAFT} // Disable if not in draft status
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your last name"
                                value={userInfo.last_name || ''}
                                onChange={(e) => setUserInfo({ ...userInfo, last_name: e.target.value })}
                                disabled={qaSessionStatus !== SessionStatus.DRAFT} // Disable if not in draft status
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your age"
                                value={userInfo.age || ''}
                                onChange={(e) => setUserInfo({ ...userInfo, age: parseInt(e.target.value) })}
                                disabled={qaSessionStatus !== SessionStatus.DRAFT} // Disable if not in draft status
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Submit and Back to Chat Button */}

                        <div className="flex space-x-4 pt-4">
                            <button
                                onClick={() => setShowPhase2(false)}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Back to Chat
                            </button>
                            <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onClick={handlePhase2Submit}>
                                Submit & Review PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Discovery</h2>
                        <p className="text-gray-600">Help us understand your needs</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                            {currentQuestion?.text}
                        </h3>

                        <div className="space-y-3">
                            {currentQuestion?.options.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleOptionSelect(currentQuestion.id, option.value)}
                                    className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 ${answers?.[currentQuestion.id] === option.value
                                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                                            : 'border-gray-200 text-gray-700'
                                        } ${qaSessionStatus !== SessionStatus.DRAFT ? 'cursor-not-allowed opacity-50' : ''}`}
                                    disabled={qaSessionStatus !== SessionStatus.DRAFT} // ✅ Disable if not in draft
                                >
                                    <div className="flex items-center">
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${answers[currentQuestion.id] === option.value
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-300'
                                                }`}
                                        >
                                            {answers[currentQuestion.id] === option.value && (
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            )}
                                        </div>
                                        <span className="font-medium">{option.label}</span>
                                    </div>
                                </button>

                            ))}
                        </div>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentQuestionIndex === 0}
                        className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${currentQuestionIndex === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        Back
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!answers[currentQuestion?.id]}
                        className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${!answers[currentQuestion?.id]
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Phase;