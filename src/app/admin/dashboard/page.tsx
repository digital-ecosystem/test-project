'use client';

import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, Clock, FileText, ChevronRight, X, Loader2, LogOut, Hourglass, Ban } from 'lucide-react';
import { DashboardQuestions, Session, SessionStatus } from '@/types';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [questionAnswer, setQuestionAnswer] = useState<DashboardQuestions[]>([]);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        // Fetch sessions from API or database
        const fetchSession = async () => {
            // setLoading('fetching');
            const response = await fetch('/api/admin/dashboard', {
                method: 'GET',
                credentials: 'include',
            });
            const data = await response.json();
            console.log("🚀 ~ fetchSession ~ data:", data)
            // setLoading(null);
            if (data?.success) {
                setSessions(data.sessions);
            } else {
                router.push('/admin/signin')
            }
        }
        fetchSession();
    }, [])

    useEffect(() => {
        if (selectedSession?.id) {
            const fetchQuestionAnswer = async () => {
                const response = await fetch(`/api/admin/dashboard/user-info/questions?sessionId=${selectedSession.id}`, {
                    method: 'GET',
                    credentials: 'include',
                });
                const data = await response.json();
                if (data?.success) {
                    setQuestionAnswer(data.data);
                } else {
                    router.push('/admin/signin')
                }
            }
            fetchQuestionAnswer();
        }
    }, [selectedSession])


    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });
            await response.json();
            router.push('/admin/signin')
        } catch (error) {
            console.log('error : ', error)
        }
    }

    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalSessions = sessions.length;
    const approvedSessions = sessions.filter(s => s.status === 'APPROVED').length;
    const draftSessions = sessions.filter(s => s.status === 'DRAFT').length;
    const pendingSessions = sessions.filter(s => s.status === 'PENDING').length;
    const rejectedSessions = sessions.filter(s => s.status === 'REJECTED').length;


    // Helper function to get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case SessionStatus.DRAFT:
                return 'bg-gray-100 text-gray-800';
            case SessionStatus.PENDING:
                return 'bg-yellow-100 text-yellow-800';
            case SessionStatus.APPROVED:
                return 'bg-green-100 text-green-800';
            case SessionStatus.REJECTED:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleSessionClick = (session: Session) => {
        setSelectedSession(session);
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedSession(null);
    };

    const handleStatusChange = async (sessionId: string, status: SessionStatus) => {
        setIsLoading(true);
        const res = await fetch('/api/admin/dashboard/user-info/session/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                status,
            }),
        });

        const data = await res.json();
        if (data.success) {
            setSessions(sessions.map(session =>
                session.id === sessionId ? { ...session, status: status } : session
            ));
        } else {
            alert('Failed to update status');
        }
        setTimeout(() => {
            setIsLoading(false);
            closeDrawer()
        }, 1000);

    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-gray-600">Welcome back!</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                Start Now
                            </button> */}
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">{process.env.NEXT_PUBLIC_ADMIN_EMAIL ? process.env.NEXT_PUBLIC_ADMIN_EMAIL[0] : 'A'}</span>
                                </div>
                                <span className="text-sm text-gray-700">{process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com'}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors text-sm font-medium shadow-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Sessions</p>
                                <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Approved</p>
                                <p className="text-2xl font-bold text-gray-900">{approvedSessions}</p>
                            </div>
                        </div>
                    </div>



                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                                <Ban className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Rejected</p>
                                <p className="text-2xl font-bold text-gray-900">{rejectedSessions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                                <Hourglass className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{pendingSessions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Draft</p>
                                <p className="text-2xl font-bold text-gray-900">{draftSessions}</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sessions Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Search and Filter */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search sessions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="all">All Status</option>
                                    <option value="DRAFT">{SessionStatus.DRAFT}</option>
                                    <option value="PENDING">{SessionStatus.PENDING}</option>
                                    <option value="REJECTED">{SessionStatus.REJECTED}</option>
                                    <option value="APPROVED">{SessionStatus.APPROVED}</option>
                                </select>
                                <span className="text-sm text-gray-500 ml-4">
                                    {filteredSessions.length} of {totalSessions} sessions
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SESSION
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        STATUS
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CREATED
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleSessionClick(session)}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{session.user.name}</div>
                                                    <div className="text-sm text-gray-500">{session.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                                                {session.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(session.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredSessions.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No sessions found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Session Details Drawer */}
            {isDrawerOpen && selectedSession && (
                isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-50 bg-opacity-60 flex justify-end backdrop-blur-sm"
                            onClick={closeDrawer}
                        />
                        {/* Drawer */}
                        <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-white shadow-xl z-50 transform transition-transform overflow-y-auto">
                            {/* Drawer Header */}
                            <div className="bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Session Details</h2>
                                        <p className="text-sm text-gray-600">Session ID: #{selectedSession.id}</p>
                                    </div>
                                    <button
                                        onClick={closeDrawer}
                                        className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Content */}
                            <div className="px-6 py-6 space-y-6">
                                {/* User Information */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">User Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600">Name</label>
                                            <p className="text-sm text-gray-900">{selectedSession.user?.name || ''}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600">Email</label>
                                            <p className="text-sm text-gray-900">{selectedSession.user.email || ''}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600">Duration</label>
                                            <p className="text-sm text-gray-900">{formatDate(selectedSession.expiresAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Session Status */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Status</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600">Current Status</label>
                                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedSession.status)}`}>
                                                {selectedSession.status}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600">Created Date</label>
                                            <p className="text-sm text-gray-900">{formatDate(selectedSession.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Question and Options */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Question & Response</h3>

                                    {questionAnswer?.length > 0 &&
                                        questionAnswer.map((item, index) => (
                                            <React.Fragment key={index}>
                                                {/* Question */}
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">Question</label>
                                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                                                        <p className="text-gray-900">{item.text}</p>
                                                    </div>
                                                </div>

                                                {/* Available Options */}
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-600 mb-2">Available Options</label>
                                                    <div className="space-y-2">
                                                        {item.options.map((option, optIndex) => {
                                                            const isSelected = option.value === item.selectedValue
                                                            return (
                                                                <div
                                                                    key={optIndex}
                                                                    className={`flex items-center p-3 rounded-lg border ${isSelected ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className={`w-2 h-2 rounded-full mr-3 ${isSelected ? 'bg-green-500' : 'bg-gray-300'
                                                                            }`}
                                                                    />
                                                                    <span
                                                                        className={`text-sm ${isSelected ? 'text-green-900 font-medium' : 'text-gray-700'
                                                                            }`}
                                                                    >
                                                                        {option.label}
                                                                    </span>
                                                                    {isSelected && <ChevronRight className="w-4 h-4 text-green-600 ml-auto" />}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Selected Answer Highlight */}
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                                                    <label className="block text-sm font-medium text-green-800 mb-1">Selected Answer</label>
                                                    <p className="text-green-900 font-semibold">
                                                        {item.options.find(option => option.value === item.selectedValue)?.label || 'N/A'}
                                                    </p>
                                                </div>

                                            </React.Fragment>
                                        ))}
                                </div>

                                {/* Download the session PDF */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Download Session PDF</h3>
                                    <button
                                        // onClick={() => router.push(`/customer/phase/${selectedSession.id}/pdf`)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                                    >
                                        <a href={`/documents/session-${selectedSession.id}.pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                            <FileText className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </a>
                                    </button>
                                </div>

                                {/* Action Buttons */}
                                {selectedSession.status === SessionStatus.PENDING &&
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Actions</h3>
                                        <div className="flex space-x-3">
                                            {selectedSession.status === SessionStatus.PENDING && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            handleStatusChange(selectedSession.id, SessionStatus.APPROVED);
                                                            // closeDrawer();
                                                        }}
                                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Approve Session
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleStatusChange(selectedSession.id, SessionStatus.REJECTED);
                                                            // closeDrawer();
                                                        }}
                                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                                                    >
                                                        <X className="w-4 h-4 mr-2" />
                                                        Reject Session
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </>
                )
            )}
        </div>
    );
}

export default Dashboard;