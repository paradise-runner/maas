'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlistGenerator from '../components/PlistGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Tag, RefreshCw, Search, X, Target, RotateCcw, Monitor, BarChart3, ExternalLink } from 'lucide-react';

interface LaunchService {
  pid: string;
  status: string;
  label: string;
  networkUrl?: string;
}

interface ServiceLabel {
  id: number;
  label: string;
  created_at: string;
}

export default function Home() {
  const [services, setServices] = useState<LaunchService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedLabels, setSavedLabels] = useState<ServiceLabel[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [showAllServices, setShowAllServices] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlistGenerator, setShowPlistGenerator] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/services');
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const data = await response.json();
      setServices(data.services);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLabels = async () => {
    try {
      const response = await fetch('/api/labels');
      if (!response.ok) {
        throw new Error('Failed to fetch labels');
      }
      const data = await response.json();
      setSavedLabels(data.labels);
      
      // Set all saved labels as selected by default (show only saved labels)
      if (!showAllServices && data.labels.length > 0) {
        const allSavedLabels = new Set(data.labels.map((label: ServiceLabel) => label.label));
        setSelectedLabels(allSavedLabels);
      }
    } catch (err) {
      console.error('Error fetching labels:', err);
    }
  };

  const toggleLabel = (label: string) => {
    const newSelected = new Set(selectedLabels);
    if (newSelected.has(label)) {
      newSelected.delete(label);
    } else {
      newSelected.add(label);
    }
    setSelectedLabels(newSelected);
  };

  const clearFilters = () => {
    setSelectedLabels(new Set());
    setShowAllServices(true);
  };

  const toggleAllServices = () => {
    if (showAllServices) {
      // Switch to showing only saved labels
      const allSavedLabels = new Set(savedLabels.map(label => label.label));
      setSelectedLabels(allSavedLabels);
      setShowAllServices(false);
    } else {
      // Switch to showing all services
      setSelectedLabels(new Set());
      setShowAllServices(true);
    }
  };

  const filteredServices = services.filter(service => {
    // Apply label filtering - only filter if labels are selected
    const labelMatch = selectedLabels.size === 0 || 
      Array.from(selectedLabels).some(selectedLabel => 
        service.label.toLowerCase().includes(selectedLabel.toLowerCase())
      );
    
    // Apply search filtering
    const searchMatch = !searchQuery || 
      service.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.pid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.pid !== 'Not Running' ? 'running' : 'stopped').includes(searchQuery.toLowerCase());
    
    return labelMatch && searchMatch;
  });

  useEffect(() => {
    fetchServices();
    fetchLabels();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              MaaS
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              Mac as a Server • Monitor & Manage System Services
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => setShowPlistGenerator(true)}
              variant="default"
              className="cursor-pointer text-sm py-2 px-4 hover:scale-105 hover:shadow-md bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create Plist
            </Button>
            <Button 
              variant="default"
              className="cursor-pointer text-sm py-2 px-4 hover:scale-105 hover:shadow-md bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              <Link href="/labels" className="flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Manage Labels
              </Link>
            </Button>
            <Button
              variant="default"
              onClick={fetchServices}
              disabled={loading}
              className="cursor-pointer text-sm py-2 px-4 hover:scale-105 hover:shadow-md bg-gradient-to-r from-orange-600 to-red-600"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-8 shadow-xl border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <Label htmlFor="search" className="text-lg font-semibold mb-3 block flex items-center gap-2">
                  <Search className="h-5 w-5" /> Search Services
                </Label>
                <Input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by service name, PID, or status..."
                  className="text-lg py-3 px-4 border-2 focus:border-blue-500 transition-all duration-300"
                />
              </div>
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="ghost"
                  className="mt-9 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Labels Filter Section */}
        {savedLabels.length > 0 && (
          <Card className="mb-8 shadow-xl border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" /> Filter by Labels
                </CardTitle>
                <Button
                  onClick={toggleAllServices}
                  variant="outline"
                  size="sm"
                  className="hover:bg-white dark:hover:bg-slate-600 transition-all duration-300"
                >
                  {showAllServices ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Saved Labels
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Clear Selection
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {savedLabels.map((label) => (
                  <Badge
                    key={label.id}
                    variant={selectedLabels.has(label.label) ? "default" : "secondary"}
                    className={`cursor-pointer text-sm py-2 px-4 hover:scale-105 hover:shadow-md ${
                      selectedLabels.has(label.label) 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg' 
                        : 'hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                    onClick={() => toggleLabel(label.label)}
                  >
                    {label.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Error: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Services Table Section */}
        {loading && services.length === 0 ? (
          <Card className="shadow-xl border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <CardContent className="text-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse"></div>
                </div>
                <p className="text-lg text-muted-foreground font-medium">Loading services...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Monitor className="h-6 w-6" /> System Services
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2">
                      <TableHead className="text-base font-semibold py-4">Status</TableHead>
                      <TableHead className="text-base font-semibold py-4">PID</TableHead>
                      <TableHead className="text-base font-semibold py-4">Service Label</TableHead>
                      <TableHead className="text-base font-semibold py-4">Network URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service, index) => (
                      <TableRow key={index} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-all duration-300 border-b">
                        <TableCell className="py-4">
                          <Badge
                            variant={service.pid !== 'Not Running' ? "default" : "secondary"}
                            className={`text-sm py-1 px-3 font-medium ${
                              service.pid !== 'Not Running' 
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-sm' 
                                : 'bg-gradient-to-r from-slate-400 to-gray-400'
                            }`}
                          >
                            {service.pid !== 'Not Running' ? 'Running' : 'Stopped'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm py-4 font-medium">
                          {service.pid}
                        </TableCell>
                        <TableCell className="font-mono text-sm py-4 font-medium">
                          {service.label}
                        </TableCell>
                        <TableCell className="py-4">
                          {service.networkUrl ? (
                            <a
                              href={service.networkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium transition-colors duration-300 hover:bg-blue-50 dark:hover:bg-blue-950 px-2 py-1 rounded"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {service.networkUrl}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Bar */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Showing {filteredServices.length} of {services.length} services
            </span>
            {searchQuery && (
              <Badge variant="outline" className="ml-2">
                <Search className="h-3 w-3 mr-1" />
                "{searchQuery}"
              </Badge>
            )}
            {!searchQuery && selectedLabels.size > 0 && (
              <Badge variant="outline" className="ml-2">
                <Tag className="h-3 w-3 mr-1" />
                {selectedLabels.size} filter{selectedLabels.size !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        <PlistGenerator
          isOpen={showPlistGenerator}
          onClose={() => setShowPlistGenerator(false)}
        />
      </div>
    </div>
  );
}
