"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function SignupPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const getPasswordStrength = (password: string) => {
    let score = 0;
    const feedback: string[] = [];
    if (password.length >= 8) score += 1; else feedback.push(t("auth.passAtLeast8", "At least 8 characters"));
    if (/[a-z]/.test(password)) score += 1; else feedback.push(t("auth.passLower", "At least one lowercase letter"));
    if (/[A-Z]/.test(password)) score += 1; else feedback.push(t("auth.passUpper", "At least one uppercase letter"));
    if (/[0-9]/.test(password)) score += 1; else feedback.push(t("auth.passNumber", "At least one number"));
    if (/[^A-Za-z0-9]/.test(password)) score += 1; else feedback.push(t("auth.passSpecial", "At least one special character"));
    if (score <= 2) return { score, strength: t("auth.weak", "Weak"), color: "text-red-500", feedback };
    if (score <= 3) return { score, strength: t("auth.fair", "Fair"), color: "text-yellow-500", feedback };
    if (score <= 4) return { score, strength: t("auth.good", "Good"), color: "text-blue-500", feedback };
    return { score, strength: t("auth.strong", "Strong"), color: "text-green-500", feedback };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    router.prefetch("/verify-email");
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);

      const redirectTo = `https://www.zanav.io/auth/callback?next=/kennel-setup`;
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(t("auth.googleFailed", "Failed to sign in with Google. Please try again."));
      setGoogleLoading(false);
    }
  };

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (passwordStrength.score < 3) { setError(t("auth.passwordTooWeak", "Password is too weak. Please make it stronger.")); return; }
    if (!passwordsMatch) { setError(t("auth.passwordsNoMatch", "Passwords do not match.")); return; }

    try {
      setLoading(true);
      setError(null);
      const redirectTo = new URL('/auth/callback?next=/kennel-setup', window.location.origin).toString();
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
      if (error) throw error;
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error("Error during signup:", err);
      setError(err.message || t("auth.signupError", "An error occurred during signup"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/landing"><Image className="mx-auto h-12 w-auto" src="/images/logo.svg" alt="Zanav.io" width={48} height={48} /></Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{t("auth.freeTrial", "Get started with your free trial")}</h2>
        <p className="mt-2 text-center text-sm text-gray-600">{t("auth.noCreditCard", "No credit card required.")}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <button onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed">
              {googleLoading ? <div className="flex items-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t("auth.signingUpGoogle", "Signing up with Google...")}</div> : <div className="flex items-center"><svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>{t("auth.continueWithGoogle", "Continue with Google")}</div>}
            </button>
          </div>

          <div className="relative mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div><div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500">{t("auth.orEmail", "Or continue with email")}</span></div></div>

          <form className="space-y-6" onSubmit={handleSignUp}>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">{error}</div>}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t("auth.emailAddress", "Email address")}</label>
              <div className="mt-1"><input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" /></div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t("auth.password", "Password")}</label>
              <div className="mt-1"><input id="password" name="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" /></div>
              {password && (<div className="mt-2"><div className="flex items-center space-x-2"><span className={`text-sm font-medium ${passwordStrength.color}`}>{passwordStrength.strength}</span><div className="flex-1 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.score <= 2 ? "bg-red-500" : passwordStrength.score <= 3 ? "bg-yellow-500" : passwordStrength.score <= 4 ? "bg-blue-500" : "bg-green-500"}`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }} /></div></div></div>)}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">{t("auth.confirmPassword", "Confirm Password")}</label>
              <div className="mt-1"><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${confirmPassword && !passwordsMatch ? "border-red-300" : "border-gray-300"}`} /></div>
              {confirmPassword && (<div className="mt-1">{passwordsMatch ? (<p className="text-sm text-green-600">{t("auth.passwordsMatch", "✓ Passwords match")}</p>) : (<p className="text-sm text-red-600">{t("auth.passwordsMismatch", "✗ Passwords do not match")}</p>)}</div>)}
            </div>
            <div>
              <button type="submit" disabled={loading || !passwordsMatch || passwordStrength.score < 3} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed">{loading ? t("auth.creatingAccount", "Creating account...") : t("auth.createAccount", "Create Account")}</button>
            </div>
          </form>

          <div className="mt-6"><div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">{t("auth.alreadyHave", "Already have an account?")}</span></div></div><div className="mt-6"><Link href="/login" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">{t("auth.signIn", "Sign in")}</Link></div></div>
        </div>
      </div>
    </div>
  );
}
