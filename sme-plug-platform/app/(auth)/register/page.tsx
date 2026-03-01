"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [company, setCompany] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, companyName: company }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Registration failed");
                return;
            }

            router.push("/dashboard");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface border border-border rounded-lg p-8">
            <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
                    Create your account
                </h1>
                <p className="font-mono text-sm text-text-muted">
                    Start building with trusted AI plugins
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-md">
                    <p className="font-mono text-xs text-red-400">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block font-mono text-[11px] text-text-faint tracking-[0.1em] mb-2">
                        COMPANY NAME
                    </label>
                    <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Corp"
                        required
                        className="w-full bg-canvas border border-border rounded-md px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-ghost outline-none focus:border-lime transition-colors"
                    />
                </div>

                <div>
                    <label className="block font-mono text-[11px] text-text-faint tracking-[0.1em] mb-2">
                        EMAIL
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        className="w-full bg-canvas border border-border rounded-md px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-ghost outline-none focus:border-lime transition-colors"
                    />
                </div>

                <div>
                    <label className="block font-mono text-[11px] text-text-faint tracking-[0.1em] mb-2">
                        PASSWORD
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 8 characters"
                            required
                            minLength={8}
                            className="w-full bg-canvas border border-border rounded-md px-4 py-3 pr-12 font-mono text-sm text-text-primary placeholder:text-text-ghost outline-none focus:border-lime transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted transition-colors bg-transparent border-none cursor-pointer"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-lime text-canvas font-mono font-bold text-sm tracking-[0.06em] py-3.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-canvas border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            CREATE ACCOUNT <ArrowRight size={14} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center space-y-2">
                <p className="font-mono text-xs text-text-faint">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-lime hover:underline no-underline"
                    >
                        Sign in →
                    </Link>
                </p>
                <p className="font-mono text-[10px] text-text-ghost">
                    By creating an account you agree to our Terms & Privacy Policy
                </p>
            </div>
        </div>
    );
}
