'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Question, UserUpdate } from '@/types';
import { generatePDF } from '@/utils/pdfGenerator';
import { useRouter } from 'next/navigation';

const Phase = () => {
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
    const router = useRouter();
    const [pdfPath, setPdfPath] = useState('');

    // Mock data for demonstration - replace with your API call
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await fetch('/api/phase', {
                    method: 'GET',
                });
                const data = await response.json();
                console.log(data);
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

    const handleOptionSelect = async (questionId: string, optionValue: string) => {
        const newAnswers = { ...answers, [questionId]: optionValue };
        setAnswers(newAnswers);

        // Persist answer immediately (optimistic update)
        try {
            await fetch('/api/answers', {
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
        // update user info
        try {
            await fetch('/api/user/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInfo)
            });
            
            const pdf = await generatePDF(questions, userInfo, 'A loan processor is a professional responsible for thoroughly examining loan applications, assessing credit standings, and finalizing loan contracts. They play an intermediary role between clients and financial institutions, ensuring timely loan approvals and protecting the organization’s credibility. With expertise in banking procedures and regulations, they analyze applicants’ eligibility and develop repayment plans while maintaining strong communication and sales skills. A loan processor acts as a key link in facilitating loan approvals and maintaining customer satisfaction.');
            // const pdf = await generatePDFFromHTML(questions, userInfo, 'A loan processor is a professional responsible for thoroughly examining loan applications, assessing credit standings, and finalizing loan contracts. They play an intermediary role between clients and financial institutions, ensuring timely loan approvals and protecting the organization’s credibility. With expertise in banking procedures and regulations, they analyze applicants’ eligibility and develop repayment plans while maintaining strong communication and sales skills. A loan processor acts as a key link in facilitating loan approvals and maintaining customer satisfaction.');
      
            // Save the PDF
            const fileName = `example-${new Date().toISOString().split('T')[0]}.pdf`
            // pdf.save(fileName);
            
            // You can also convert to blob for upload to server
            const pdfBlob = pdf.output('blob');
            console.log("🚀 ~ handlePhase2Submit ~ pdfBlob:", pdfBlob)
            // uploadPDFToServer(pdfBlob);

            const arrayBuffer = await pdfBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const pdfSave = await fetch('/api/phase/save-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, pdfBase64: buffer })
            });
            const pdfSaveResponse = await pdfSave.json();
            console.log("pdf Save : ", pdfSaveResponse)
            if(pdfSaveResponse?.success) {
                setPdfPath('http://localhost:3001'+pdfSaveResponse.fileUrl);
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

    if(pdfPath) {
        return (
            // Display full screen
            <div className="flex flex-col items-center justify-center h-screen w-full">
                <div className="bg-white p-4 rounded-lg shadow-md w-full h-full">
                    {/* Load PDF in pdf viewer or Iframe */}
                    <div className="flex justify-center w-full h-full">
                        <iframe src={pdfPath} width="100%" height="100%" frameBorder="0" scrolling="no" />
                         {/* Response summary */}
                        <button 
                            className=""
                        >
                            <a href={pdfPath} download={'fileName'}>
                                Save PDF
                            </a>
                        </button>
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
                            />
                        </div>

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
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${answers[currentQuestion.id] === option.value
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300'
                                            }`}>
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