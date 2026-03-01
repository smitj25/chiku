import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
            {/* BG texture */}
            <div className="scanline-overlay" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 no-underline">
                        <div
                            className="w-8 h-8"
                            style={{
                                background: "linear-gradient(135deg, #a3e635, #65a30d)",
                                clipPath:
                                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                            }}
                        />
                        <span className="font-mono font-bold text-xl text-text-primary tracking-tight">
                            sme<span className="text-lime">plug</span>
                        </span>
                    </Link>
                </div>
                {children}
            </div>
        </div>
    );
}
