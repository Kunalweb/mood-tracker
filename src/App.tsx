/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('moodTrackerUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleOnboardingComplete = (userData: any) => {
    setUser(userData);
    localStorage.setItem('moodTrackerUser', JSON.stringify(userData));
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/80 to-transparent -z-10"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/20 blur-3xl -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-3xl -z-10"></div>
      
      <div className="relative z-10">
        {!user ? (
          <Onboarding onComplete={handleOnboardingComplete} />
        ) : (
          <Dashboard user={user} />
        )}
      </div>
    </div>
  );
}
