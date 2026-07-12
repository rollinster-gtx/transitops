/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, ShieldCheck, Key, LogIn, UserCheck } from 'lucide-react';
import { Role } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { setUserProfile, getUserProfile } from '../firebaseService';

interface LoginViewProps {
  onLogin: (role: Role, name: string, email: string) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to map typed passwords to compliant firebase passwords
  const getFirebaseCredentials = (rawEmail: string, rawPassword: string) => {
    let emailMapped = rawEmail.trim().toLowerCase();
    let passwordMapped = rawPassword;

    // Map short legacy preset credentials
    if (emailMapped === 'admin@transitops.com' && rawPassword === 'admin') {
      passwordMapped = 'admin123';
    } else if (emailMapped === 'dispatch@transitops.com' && rawPassword === 'dispatch') {
      passwordMapped = 'dispatch123';
    } else if (emailMapped === 'maint@transitops.com' && rawPassword === 'maint') {
      passwordMapped = 'maint123';
    } else if (emailMapped === 'guest@transitops.com' && rawPassword === 'guest') {
      passwordMapped = 'guest123';
    } else if (passwordMapped.length < 6) {
      // Pad other custom short passwords to comply with 6-char limit
      passwordMapped = passwordMapped.padEnd(6, '1');
    }

    // Role detection
    let role: Role = 'viewer';
    let name = emailMapped.split('@')[0];

    if (emailMapped === 'admin@transitops.com') {
      role = 'admin';
      name = 'Administrator Chief';
    } else if (emailMapped === 'dispatch@transitops.com' || emailMapped === 'dispatch.jones@transitops.com') {
      role = 'dispatcher';
      name = 'Dispatcher Jones';
      emailMapped = 'dispatch@transitops.com'; // Standardize
    } else if (emailMapped === 'maint@transitops.com' || emailMapped === 'sandro.maint@transitops.com') {
      role = 'maintenance';
      name = 'Sandro Ramirez';
      emailMapped = 'maint@transitops.com'; // Standardize
    } else if (emailMapped === 'guest@transitops.com' || emailMapped === 'jane.spector@transitops.com') {
      role = 'viewer';
      name = 'Jane Spector';
      emailMapped = 'guest@transitops.com'; // Standardize
    }

    return { email: emailMapped, password: passwordMapped, role, name };
  };

  const handleAuthFlow = async (rawEmail: string, rawPassword: string) => {
    setError('');
    setLoading(true);
    const { email: fbEmail, password: fbPassword, role, name } = getFirebaseCredentials(rawEmail, rawPassword);

    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, fbEmail, fbPassword);
      } catch (signInErr: any) {
        // If user not found or invalid credential (meaning it might be new on-the-fly user registration), try to register
        if (
          signInErr.code === 'auth/user-not-found' ||
          signInErr.code === 'auth/invalid-credential' ||
          signInErr.code === 'auth/invalid-login-credentials'
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, fbEmail, fbPassword);
          } catch (signUpErr: any) {
            if (signUpErr.code === 'auth/email-already-in-use') {
              throw new Error('Invalid email or password.');
            } else {
              throw signUpErr;
            }
          }
        } else {
          throw signInErr;
        }
      }

      const user = userCredential.user;

      // Load or initialize profile in Firestore
      let profile = await getUserProfile(user.uid);
      if (!profile) {
        profile = { uid: user.uid, email: fbEmail, name, role };
        await setUserProfile(user.uid, profile);
      }

      // Trigger parent callback
      onLogin(profile.role, profile.name, fbEmail);
    } catch (err: any) {
      console.error('Login error:', err);
      let friendlyMessage = 'Authentication failed. Please verify your credentials.';
      if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'The email address is badly formatted.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'The password must be at least 6 characters.';
      } else if (err.message === 'Invalid email or password.') {
        friendlyMessage = 'Invalid email or password.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    handleAuthFlow(email, password);
  };

  const handlePresetLogin = (role: Role, name: string, userEmail: string) => {
    let presetPassword = 'guest';
    if (role === 'admin') presetPassword = 'admin';
    if (role === 'dispatcher') presetPassword = 'dispatch';
    if (role === 'maintenance') presetPassword = 'maint';
    handleAuthFlow(userEmail, presetPassword);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto h-16 w-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
        >
          <Truck className="h-9 w-9 text-slate-900" />
        </motion.div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white font-sans">
          TransitOps
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enterprise Fleet Management &amp; Dispatch Terminal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-slate-800 py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-700"
        >
          {error && (
            <div className="mb-4 bg-red-950/50 border border-red-500 text-red-200 text-xs px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-slate-600 bg-slate-900/50 border text-slate-100 placeholder-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-4 py-3 focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="name@transitops.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-slate-600 bg-slate-900/50 border text-slate-100 placeholder-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-4 py-3 focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-emerald-500 py-3 px-4 text-sm font-semibold text-slate-900 shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-all font-sans cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In Securely...
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" /> Sign In Securely
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs text-slate-400 uppercase">
                <span className="bg-slate-800 px-3 font-medium">Or log in with RBAC Presets</span>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  handlePresetLogin('admin', 'Administrator Chief', 'admin@transitops.com')
                }
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 transition-all text-slate-300 hover:text-white hover:border-emerald-500/50 text-left cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Administrator</span>
                <span className="text-[10px] text-slate-500">Full Access Suite</span>
              </button>

              <button
                onClick={() =>
                  handlePresetLogin('dispatcher', 'Dispatcher Jones', 'dispatch@transitops.com')
                }
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 transition-all text-slate-300 hover:text-white hover:border-indigo-500/50 text-left cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserCheck className="w-5 h-5 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Dispatcher</span>
                <span className="text-[10px] text-slate-500">Trips &amp; Logistics</span>
              </button>

              <button
                onClick={() =>
                  handlePresetLogin('maintenance', 'Sandro Ramirez', 'maint@transitops.com')
                }
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 transition-all text-slate-300 hover:text-white hover:border-amber-500/50 text-left cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Truck className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Maintenance</span>
                <span className="text-[10px] text-slate-500">Service &amp; Fueling</span>
              </button>

              <button
                onClick={() => handlePresetLogin('viewer', 'Jane Spector', 'guest@transitops.com')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 transition-all text-slate-300 hover:text-white hover:border-slate-500/50 text-left cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Key className="w-5 h-5 text-slate-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Guest Auditor</span>
                <span className="text-[10px] text-slate-500">View Only Access</span>
              </button>
            </div>
            <div className="mt-4 text-center">
              <span className="text-[10px] text-slate-500 italic">
                Tip: Password is the preset name (e.g., &apos;admin&apos; for Admin Chief)
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
