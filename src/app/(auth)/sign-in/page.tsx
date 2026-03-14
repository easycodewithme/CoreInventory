'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, KeyRound, ArrowRight, Shield, UserCog, User } from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type AuthMode = 'password' | 'otp';

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Signed in successfully');
      router.push('/dashboard');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setOtpSent(true);
      toast.success('OTP sent to your email!');
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Signed in successfully');
      router.push('/dashboard');
    } catch {
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  const Spinner = () => (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div className="relative">
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-primary/40 via-primary/10 to-transparent opacity-75" />
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-primary/20 via-transparent to-transparent blur-sm" />

      <Card className="relative border-0 bg-card shadow-2xl shadow-primary/5">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-xl font-semibold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Mode toggle */}
          <div className="flex rounded-lg bg-secondary p-1 mb-5">
            <button
              type="button"
              onClick={() => { setMode('password'); setOtpSent(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                mode === 'password'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode('otp')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                mode === 'otp'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Email OTP
            </button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="h-10 w-full text-sm font-medium" disabled={loading}>
                {loading ? <span className="flex items-center gap-2"><Spinner /> Signing in...</span> : 'Sign in'}
              </Button>
            </form>
          ) : !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="otp-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                We&apos;ll send a 6-digit code to your email for passwordless sign-in.
              </p>

              <Button type="submit" className="h-10 w-full text-sm font-medium" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2"><Spinner /> Sending OTP...</span>
                ) : (
                  <span className="flex items-center gap-2">Send OTP <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-lg bg-emerald-900/20 border border-emerald-800/30 p-3">
                <p className="text-sm text-emerald-300">
                  OTP sent to <span className="font-medium">{email}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp-code">Enter 6-digit code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="otp-code"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-10 pl-10 text-center font-mono text-lg tracking-[0.5em]"
                    disabled={loading}
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <Button type="submit" className="h-10 w-full text-sm font-medium" disabled={loading || otp.length !== 6}>
                {loading ? <span className="flex items-center gap-2"><Spinner /> Verifying...</span> : 'Verify & Sign in'}
              </Button>

              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(''); }}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Didn&apos;t receive it? Send again
              </button>
            </form>
          )}

          {/* Demo Accounts */}
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs text-center text-muted-foreground mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', email: 'admin@coreinventory.demo', password: 'admin123', icon: Shield, color: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20' },
                { label: 'Manager', email: 'manager@coreinventory.demo', password: 'manager123', icon: UserCog, color: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' },
                { label: 'Staff', email: 'staff@coreinventory.demo', password: 'staff123', icon: User, color: 'text-zinc-400 bg-zinc-500/10 hover:bg-zinc-500/20' },
              ].map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const supabase = createClient();
                      const { error } = await supabase.auth.signInWithPassword({
                        email: demo.email,
                        password: demo.password,
                      });
                      if (error) { toast.error(error.message); return; }
                      toast.success(`Signed in as ${demo.label}`);
                      router.push('/dashboard');
                    } catch { toast.error('Login failed'); }
                    finally { setLoading(false); }
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs font-medium transition-colors ${demo.color}`}
                >
                  <demo.icon className="h-4 w-4" />
                  {demo.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
