/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Truck, ShieldCheck, Key, LogIn, UserCheck, UserPlus, Eye, EyeOff, Chrome } from 'lucide-react';
import { Role } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { setUserProfile, getUserProfile } from '../firebaseService';

interface LoginViewProps {
  onLogin: (role: Role, name: string, email: string) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpRole, setSignUpRole] = useState<Role>('viewer');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Silently seed default administrator account on mount
  useEffect(() => {
    const seedAdmin = async () => {
      try {
        // Try creating the admin account
        const cred = await createUserWithEmailAndPassword(auth, 'admin@transitops.com', 'admin123');
        const user = cred.user;
        await setUserProfile(user.uid, {
          email: 'admin@transitops.com',
          name: 'Administrator Chief',
          role: 'admin',
        });
        console.log('Successfully seeded default administrator account admin@transitops.com.');
      } catch (err: any) {
        // Expected if already registered
        if (err.code === 'auth/email-already-in-use') {
          console.log('Default administrator account is already registered and ready.');
        } else {
          console.error('Quiet admin seeding log (ignorable):', err.message);
        }
      }
    };
    seedAdmin();
  }, []);

  // Map raw legacy short preset logins or standard credentials
  const getFirebaseCredentials = (rawEmail: string, rawPassword: string) => {
    let emailMapped = rawEmail.trim().toLowerCase();
    let passwordMapped = rawPassword;

    // Map short legacy preset credentials to compliant minimum lengths
    if (emailMapped === 'admin@transitops.com' && rawPassword === 'admin') {
      passwordMapped = 'admin123';
    } else if (emailMapped === 'dispatch@transitops.com' && rawPassword === 'dispatch') {
      passwordMapped = 'dispatch123';
    } else if (emailMapped === 'maint@transitops.com' && rawPassword === 'maint') {
      passwordMapped = 'maint123';
    } else if (emailMapped === 'guest@transitops.com' && rawPassword === 'guest') {
      passwordMapped = 'guest123';
    } else if (passwordMapped.length < 6) {
      passwordMapped = passwordMapped.padEnd(6, '1');
    }

    // Default roles and names map
    let role: Role = 'viewer';
    let name = emailMapped.split('@')[0];

    if (emailMapped === 'admin@transitops.com') {
      role = 'admin';
      name = 'Administrator Chief';
    } else if (emailMapped === 'dispatch@transitops.com') {
      role = 'dispatcher';
      name = 'Dispatcher Jones';
    } else if (emailMapped === 'maint@transitops.com') {
      role = 'maintenance';
      name = 'Sandro Ramirez';
    } else if (emailMapped === 'guest@transitops.com') {
      role = 'viewer';
      name = 'Jane Spector';
    }

    return { email: emailMapped, password: passwordMapped, role, name };
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const { email: fbEmail, password: fbPassword } = getFirebaseCredentials(email, password);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, fbEmail, fbPassword);
      const user = userCredential.user;

      // Load profile in Firestore, or fallback if none exists
      let profile = await getUserProfile(user.uid);
      if (!profile) {
        // Fallback or on-the-fly registration matching the standardized email mapped creds
        const mappedInfo = getFirebaseCredentials(email, password);
        const profileData = {
          email: fbEmail,
          name: mappedInfo.name,
          role: mappedInfo.role,
        };
        await setUserProfile(user.uid, profileData);
        profile = { uid: user.uid, ...profileData };
      }

      onLogin(profile.role, profile.name, fbEmail);
    } catch (err: any) {
      console.error('Sign In error:', err);
      let friendlyMessage = 'Authentication failed. Please verify your credentials.';
      if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'The email address is badly formatted.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!signUpName || !email || !password || !confirmPassword) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (password.length < 6) {
      setError('The password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const cleanedEmail = email.trim().toLowerCase();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanedEmail, password);
      const user = userCredential.user;

      // Create profile in Firestore
      const profileData = {
        email: cleanedEmail,
        name: signUpName.trim(),
        role: signUpRole,
      };
      await setUserProfile(user.uid, profileData);
      const profile = { uid: user.uid, ...profileData };

      setSuccess('Account registered successfully! Logging you in...');
      
      // Delay slightly for nice UX
      setTimeout(() => {
        onLogin(profile.role, profile.name, cleanedEmail);
      }, 1000);
    } catch (err: any) {
      console.error('Sign Up error:', err);
      let friendlyMessage = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already registered.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'The email address is badly formatted.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'The password is too weak. Must be at least 6 characters.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      let profile = await getUserProfile(user.uid);
      if (!profile) {
        const selectedRole = isSignUp ? signUpRole : 'viewer';
        const profileData = {
          email: user.email || '',
          name: user.displayName || 'Google User',
          role: selectedRole,
        };
        await setUserProfile(user.uid, profileData);
        profile = { uid: user.uid, ...profileData };
      }

      setSuccess('Google Sign-In successful!');
      setTimeout(() => {
        onLogin(profile.role, profile.name, profile.email);
      }, 800);
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePresetLogin = (role: Role, name: string, userEmail: string) => {
    setEmail(userEmail);
    // Presets passwords are known
    let presetPassword = 'guest';
    if (role === 'admin') presetPassword = 'admin';
    if (role === 'dispatcher') presetPassword = 'dispatch';
    if (role === 'maintenance') presetPassword = 'maint';
    
    setPassword(presetPassword);
    
    // Auto submit
    setError('');
    setLoading(true);
    const { email: fbEmail, password: fbPassword } = getFirebaseCredentials(userEmail, presetPassword);

    signInWithEmailAndPassword(auth, fbEmail, fbPassword)
      .then(async (userCredential) => {
        const user = userCredential.user;
        let profile = await getUserProfile(user.uid);
        if (!profile) {
          const profileData = { email: fbEmail, name, role };
          await setUserProfile(user.uid, profileData);
          profile = { uid: user.uid, ...profileData };
        }
        onLogin(profile.role, profile.name, fbEmail);
      })
      .catch(async (err) => {
        // If they don't exist yet, we register them on the fly
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, fbEmail, fbPassword);
            const user = userCredential.user;
            const profileData = { email: fbEmail, name, role };
            await setUserProfile(user.uid, profileData);
            onLogin(role, name, fbEmail);
          } catch (signUpErr: any) {
            console.error('On-the-fly registration failed:', signUpErr);
            setError('Failed to sign in with preset. Please try entering credentials manually.');
            setLoading(false);
          }
        } else {
          console.error('Preset login error:', err);
          setError('Authentication failed for preset.');
          setLoading(false);
        }
      });
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
          className="mx-auto h-16 w-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse"
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
            <div className="mb-4 bg-red-950/50 border border-red-500 text-red-200 text-xs px-3 py-2 rounded-lg font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-950/50 border border-emerald-500 text-emerald-200 text-xs px-3 py-2 rounded-lg font-semibold animate-pulse">
              {success}
            </div>
          )}

          {/* Form Tabs (Switch Sign In / Sign Up) */}
          <div className="flex border-b border-slate-700 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                !isSignUp
                  ? 'border-emerald-500 text-white font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4 inline-block mr-1.5 align-text-bottom" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                isSignUp
                  ? 'border-emerald-500 text-white font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4 inline-block mr-1.5 align-text-bottom" />
              Sign Up
            </button>
          </div>

          {!isSignUp ? (
            /* Sign In Form */
            <form className="space-y-6" onSubmit={handleSignIn}>
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
                    placeholder="admin@transitops.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border-slate-600 bg-slate-900/50 border text-slate-100 placeholder-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm pl-4 pr-10 py-3 focus:outline-none transition-colors disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400 uppercase">
                  <span className="bg-slate-800 px-2">Or continue with</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex w-full justify-center items-center rounded-xl border border-slate-600 bg-slate-900/40 hover:bg-slate-900/80 text-white font-semibold py-3 px-4 text-sm shadow-sm transition-all font-sans cursor-pointer disabled:opacity-50"
                >
                  <Chrome className="w-4 h-4 mr-2 text-emerald-400" /> Sign In with Google
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up Form */
            <form className="space-y-4" onSubmit={handleSignUp}>
              <div>
                <label htmlFor="signUpName" className="block text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="signUpName"
                    name="signUpName"
                    type="text"
                    required
                    disabled={loading}
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="block w-full rounded-xl border-slate-600 bg-slate-900/50 border text-slate-100 placeholder-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-4 py-3 focus:outline-none transition-colors disabled:opacity-50"
                    placeholder="Sandro Ramirez"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signUpEmail" className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="signUpEmail"
                    name="signUpEmail"
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border-slate-600 bg-slate-900/50 border text-slate-100 placeholder-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-4 py-3 focus:outline-none transition-colors disabled:opacity-50"
                    placeholder="user@transitops.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="signUpPass" className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="signUpPass"
                      name="signUpPass"
                      type="password"
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
                  <label htmlFor="confirmPass" className="block text-sm font-medium text-slate-300">
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPass"
                      name="confirmPass"
                      type="password"
                      required
                      disabled={loading}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-xl border-slate-600 bg-slate-900/50 border text-slate-100 placeholder-slate-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-4 py-3 focus:outline-none transition-colors disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Role Picker Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Select System Role
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(['admin', 'dispatcher', 'maintenance', 'viewer'] as Role[]).map((r) => {
                    const label = r === 'admin' ? 'Admin' : r === 'dispatcher' ? 'Dispatcher' : r === 'maintenance' ? 'Maintenance' : 'Viewer';
                    const active = signUpRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSignUpRole(r)}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                          active
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-900/50 border-slate-600 text-slate-300 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
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
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" /> Register &amp; Sign In
                    </>
                  )}
                </button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400 uppercase">
                  <span className="bg-slate-800 px-2">Or continue with</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex w-full justify-center items-center rounded-xl border border-slate-600 bg-slate-900/40 hover:bg-slate-900/80 text-white font-semibold py-3 px-4 text-sm shadow-sm transition-all font-sans cursor-pointer disabled:opacity-50"
                >
                  <Chrome className="w-4 h-4 mr-2 text-emerald-400" /> Sign Up with Google
                </button>
              </div>
            </form>
          )}

          {/* Preset logins section - only shown in Sign In mode to avoid clutter */}
          {!isSignUp && (
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
                  Tip: Default admin is seeded with admin123 password.
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
