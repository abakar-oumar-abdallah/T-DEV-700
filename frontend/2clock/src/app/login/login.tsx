'use client';
import { useState } from 'react';
import { LoginUser } from '../../auth/auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await LoginUser({ email, password });
    if (result.success && result.data) {
      console.log('Login successful:', result);
      localStorage.setItem('session', result.data.token);
      localStorage.setItem('userPrenom', result.data.user.first_name);
      localStorage.setItem('userNom', result.data.user.last_name);
      router.push('/employee');
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 opacity-20 pointer-events-none md:left-0 md:translate-x-[-20%] hidden md:block">
        <Image src="/2clock_bw.svg" alt="" width={800} height={600} className="transform translate-y-[20%]" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <Image src="/2clocktitle.svg" alt="2Clock Logo" width={260} height={48} className="mx-auto mb-4" />
        <div className="rounded-xl shadow-2xl p-8 space-y-6 bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-semibold font-poppins text-foreground">Welcome Back</h2>
            <p className="text-sm mt-2 font-poppins text-secondary">Sign in to your account</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium font-poppins text-foreground">Email</label>
              <input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-secondary rounded-lg font-poppins text-base bg-background text-foreground placeholder-secondary/60 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all duration-200" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium font-poppins text-foreground">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 pr-12 border border-secondary rounded-lg font-poppins text-base bg-background text-foreground placeholder-secondary/60 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all duration-200" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary hover:text-foreground transition-colors">
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {error && <div className="p-3 border border-red-400 rounded-lg font-poppins text-sm bg-red-50 text-red-600">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 font-poppins text-base disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/50 transform hover:scale-[1.02]">
              {loading ? <span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Signing in...</span> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}