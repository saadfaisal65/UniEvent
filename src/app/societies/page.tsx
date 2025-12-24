"use client";

import { useQuery } from "@tanstack/react-query";
import { getSocieties } from "@/lib/services";
import { Loader2, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SocietiesPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: societies, isLoading, error } = useQuery({
        queryKey: ['societies'],
        queryFn: getSocieties,
    });

    const filteredSocieties = (societies || []).filter((society) =>
        society.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        society.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-indigo-600 px-6 py-16 text-center shadow-xl md:px-12 md:py-20 dark:bg-indigo-900">
                <div className="absolute inset-0 opacity-10 pattern-grid-lg text-white" />
                <div className="relative z-10 mx-auto max-w-4xl space-y-6">
                    <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                        Explore Campus Communities
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-indigo-100">
                        Find your crowd. Join societies that match your passions and interests.
                    </p>

                    <div className="mx-auto mt-8 flex w-full max-w-md items-center rounded-full bg-white p-2 shadow-lg dark:bg-slate-950">
                        <Search className="ml-3 h-5 w-5 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search societies..."
                            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-900 dark:text-white placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {isLoading ? (
                <div className="flex justify-center py-32">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                </div>
            ) : error ? (
                <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    Failed to load societies. Please try again later.
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSocieties.length > 0 ? (
                        filteredSocieties.map((society) => (
                            <Card key={society.id} className="group overflow-hidden hover:shadow-lg transition-all border-slate-200 dark:border-slate-800">
                                <CardHeader className="flex flex-row items-center gap-4 bg-slate-50 dark:bg-slate-900/50 pb-6">
                                    <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-800 shadow-sm">
                                        <AvatarImage src={society.logoUrl} alt={society.name} />
                                        <AvatarFallback className="text-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400">
                                            {society.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-lg">{society.name}</CardTitle>
                                        <CardDescription className="line-clamp-1">
                                            President: {society.presidentName}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 min-h-[60px]">
                                        {society.description || "No description available."}
                                    </p>
                                </CardContent>
                                <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/20 p-4">
                                    <div className="w-full text-xs text-slate-500 flex justify-between items-center">
                                         <span>Convener: {society.convenerName}</span>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-slate-500">
                            No societies found matching your search.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
