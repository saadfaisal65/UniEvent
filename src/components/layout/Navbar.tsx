"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays, Menu, User as UserIcon, LogOut, PlusCircle, Users, ShieldCheck } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuth } from "@/context/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { account } from "@/lib/appwrite";
import { useRouter } from "next/navigation";

export function Navbar() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await account.deleteSession("current");
            window.location.reload(); // Simple reload to clear state
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const NavLinks = () => (
        <>
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Discover
            </Link>
            <Link href="/create-event" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> Host Event
            </Link>
            {/* Placeholder for future Societies page */}
            <Link href="/societies" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2">
                <Users className="h-4 w-4" /> Societies
            </Link>
        </>
    );

    return (
        <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <CalendarDays className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            UniEvent
                        </span>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <NavLinks />
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                    <ModeToggle />

                    {loading ? (
                        <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
                    ) : user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                                        <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push('/create-event')}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Host an Event
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/societies')}>
                                    <Users className="mr-2 h-4 w-4" /> Browse Societies
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push('/admin')}>
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" /> Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="hidden md:flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Sign In</Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">Get Started</Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right">
                                <div className="flex flex-col gap-6 mt-8">
                                    <NavLinks />
                                    {!user && (
                                        <div className="flex flex-col gap-2 mt-4">
                                            <Link href="/login" onClick={() => setIsOpen(false)}>
                                                <Button variant="outline" className="w-full">Sign In</Button>
                                            </Link>
                                            <Link href="/signup" onClick={() => setIsOpen(false)}>
                                                <Button className="w-full bg-indigo-600">Get Started</Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    );
}
