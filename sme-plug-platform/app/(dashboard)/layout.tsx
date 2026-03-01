import Sidebar from "@/components/dashboard/Sidebar";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await verifySession();
    if (!session) redirect("/login");

    const tenant = await db.tenant.findUnique({
        where: { id: session.tenantId },
        select: { companyName: true, plan: true }
    });

    return (
        <div className="min-h-screen bg-canvas flex">
            <Sidebar userEmail={session.email} companyName={tenant?.companyName || "Unknown"} />
            <main className="flex-1 min-w-0 overflow-y-auto">
                {/* Topbar */}
                <div className="h-[70px] sticky top-0 z-30 bg-[rgba(8,8,12,0.96)] backdrop-blur-xl border-b border-border flex items-center justify-between px-6 lg:px-8">
                    <div className="lg:hidden w-8" />
                    <div className="font-mono text-xs text-text-ghost tracking-[0.15em] font-semibold">
                        TETHER PLATFORM
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="font-mono text-xs text-text-faint capitalize">
                            {tenant?.plan || session.plan} Plan
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-plug-healthcare animate-pulse" />
                    </div>
                </div>
                <div className="px-5 py-7 lg:px-8 lg:py-8">
                    <div className="page-shell">{children}</div>
                </div>
            </main>
        </div>
    );
}
