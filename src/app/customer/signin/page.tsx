'use client';

// import { useState } from 'react';
// import { Mail, Lock, ArrowRight } from 'lucide-react';

// export default function SignInPage() {
//   const [email, setEmail] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [message, setMessage] = useState('');
//   const [messageType, setMessageType] = useState('');

//   const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setMessage('');

//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1500));
      
//       // Here you would typically make an API call to your authentication endpoint
//       // const response = await fetch('/api/auth/signin', {
//       //   method: 'POST',
//       //   headers: { 'Content-Type': 'application/json' },
//       //   body: JSON.stringify({ email })
//       // });

//       setMessage('Check your email for a magic link to sign in!');
//       setMessageType('success');
//       setEmail('');
//     } catch (error: unknown) {
//         console.error(error);
//       setMessage('Something went wrong. Please try again.');
//       setMessageType('error');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
//       <div className="w-full max-w-md">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
//             <Lock className="w-8 h-8 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
//           <p className="text-gray-600">Enter your email to sign in to your account</p>
//         </div>

//         {/* Sign In Form */}
//         <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
//           <div className="space-y-6">
//             {/* Email Input */}
//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//                 Email Address
//               </label>
//               <div className="relative">
//                 <input
//                   type="email"
//                   id="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 pl-12 bg-white/50 backdrop-blur-sm"
//                   placeholder="Enter your email address"
//                 />
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Mail className="h-5 w-5 text-gray-400" />
//                 </div>
//               </div>
//             </div>

//             {/* Message Display */}
//             {message && (
//               <div className={`p-4 rounded-lg text-sm ${
//                 messageType === 'success' 
//                   ? 'bg-green-50 text-green-700 border border-green-200' 
//                   : 'bg-red-50 text-red-700 border border-red-200'
//               }`}>
//                 {message}
//               </div>
//             )}

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={isLoading || !email}
//               className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
//               onClick={(e) => handleSubmit(e)}
//             >
//               {isLoading ? (
//                 <>
//                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
//                   <span>Sending magic link...</span>
//                 </>
//               ) : (
//                 <>
//                   <span>Continue with Email</span>
//                   <ArrowRight className="w-4 h-4" />
//                 </>
//               )}
//             </button>
//           </div>

//           {/* Additional Info */}
//           <div className="mt-6 text-center">
//             <p className="text-xs text-gray-500">
//               We&apos;ll send you a magic link to sign in securely without a password.
//             </p>
//           </div>

//         </div>

//         {/* Footer */}
//         {/* <div className="text-center mt-8">
//           <p className="text-sm text-gray-600">
//             Don&apos;t have an account?{' '}
//             <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
//               Sign up
//             </button>
//           </p>
//         </div> */}
//       </div>
//     </div>
//   );
// }


import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function OTPAuthPostgres() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  // const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSendOTP = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.user) {
          setMessage('Authentication successful! Welcome back!');
          setMessageType('success');
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/customer/dashboard';
          }, 2000);
        } else {
          setStep('otp');
          setMessage('OTP sent to your email! Check your inbox.');
          setMessageType('success');
        }
      } else {
        setMessage(data.message || 'Failed to send OTP');
        setMessageType('error');
      }
    } catch (error) {
      console.log("🚀 ~ handleSendOTP ~ error:", error)
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Authentication successful! Welcome back!');
        setMessageType('success');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/customer/dashboard';
        }, 2000);
      } else {
        setMessage(data.message || 'Invalid OTP');
        setMessageType('error');
      }
    } catch (error) {
      console.log("🚀 ~ handleVerifyOTP ~ error:", error)
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('email');
    setOtp('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'email' ? 'Sign In' : 'Verify Code'}
          </h1>
          <p className="text-gray-600">
            {step === 'email' 
              ? 'Enter your details to receive a verification code' 
              : `Enter the 6-digit code sent to ${email}`
            }
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {step === 'email' ? (
            <div className="space-y-6">
              {/* Name Input */}
              {/* <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 pl-12"
                    placeholder="Enter your full name"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div> */}

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 pl-12"
                    placeholder="Enter your email"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading || !email}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex justify-between items-center text-sm">
                <button
                  onClick={resetForm}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Back to email
                </button>
                <button
                  onClick={(e) => {
                    setStep('email');
                    handleSendOTP(e);
                  }}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Resend code
                </button>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg text-sm ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}