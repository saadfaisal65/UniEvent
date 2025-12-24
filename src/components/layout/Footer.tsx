import Link from "next/link";
import { CalendarDays, Github, Twitter } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t bg-slate-50 dark:bg-slate-950 mt-auto">
            <div className="container mx-auto py-12 md:py-16 lg:py-20 px-4 md:px-0">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                UniEvent
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                            The ultimate platform for discovering and hosting campus events. Join the community today.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wider uppercase mb-4">Product</h4>
                        <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                            <li><Link href="/" className="hover:text-indigo-600 transition-colors">Discover</Link></li>
                            <li><Link href="/create-event" className="hover:text-indigo-600 transition-colors">Host Event</Link></li>
                            <li><Link href="/societies" className="hover:text-indigo-600 transition-colors">Societies</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wider uppercase mb-4">Resources</h4>
                        <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                            <li><Link href="#" className="hover:text-indigo-600 transition-colors">Help Center</Link></li>
                            <li><Link href="#" className="hover:text-indigo-600 transition-colors">Guidelines</Link></li>
                            <li><Link href="#" className="hover:text-indigo-600 transition-colors">Contact Support</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wider uppercase mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                            <li><Link href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        © {new Date().getFullYear()} UniEvent. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Github className="h-5 w-5" /></Link>
                        <Link href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Twitter className="h-5 w-5" /></Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
