import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-canvas flex">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-y-auto">
                {/* Topbar */}
                <div className="h-16 sticky top-0 z-30 bg-[rgba(8,8,12,0.95)] backdrop-blur-xl border-b border-border flex items-center justify-between px-8 lg:px-10">
                    <div className="lg:hidden w-8" />
                    <div className="font-mono text-xs text-text-ghost tracking-[0.15em] font-semibold">
                        SME-PLUG PLATFORM
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="font-mono text-xs text-text-faint">
                            Starter Plan
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-plug-healthcare animate-pulse" />
                    </div>
                </div>
                <div className="p-8 lg:p-10">{children}</div>
            </main>
        </div>
    );
}
