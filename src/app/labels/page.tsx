'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag, Plus, Loader2, Lightbulb, Briefcase, Calendar, Trash2 } from 'lucide-react';

interface ServiceLabel {
  id: number;
  label: string;
  created_at: string;
}

export default function LabelsManagement() {
  const [labels, setLabels] = useState<ServiceLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/labels');
      if (!response.ok) {
        throw new Error('Failed to fetch labels');
      }
      const data = await response.json();
      setLabels(data.labels);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const addLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    try {
      setAdding(true);
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label: newLabel.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add label');
      }

      setLabels([...labels, data.label]);
      setNewLabel('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add label');
    } finally {
      setAdding(false);
    }
  };

  const removeLabel = async (id: number) => {
    try {
      const response = await fetch(`/api/labels?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove label');
      }

      setLabels(labels.filter(label => label.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove label');
    }
  };

  useEffect(() => {
    fetchLabels();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent mb-4 flex items-center justify-center gap-3">
              <Tag className="h-12 w-12 text-emerald-600" /> Labels
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              Organize & Filter Your Services
            </p>
          </div>
          <div className="flex justify-center">
            <Button asChild variant="outline" className="border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all duration-300 px-6 py-3" size="lg">
              <Link href="/">
                ← Back to Services
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Error: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Add New Label Section */}
        <Card className="mb-8 shadow-xl border-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Plus className="h-6 w-6" /> Add New Label
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addLabel} className="flex gap-4 mb-4">
              <Input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Enter label name (e.g., 'docker', 'database', 'web')"
                disabled={adding}
                className="flex-1 text-lg py-3 px-4 border-2 focus:border-emerald-500 transition-all duration-300"
              />
              <Button
                type="submit"
                disabled={adding || !newLabel.trim()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 px-6"
                size="lg"
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Label
                  </>
                )}
              </Button>
            </form>
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4 border border-emerald-200 dark:border-slate-600">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> <strong>Tip:</strong> Labels are used to filter services on the main page. Add keywords that appear in service names you want to group together.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Saved Labels Section */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="h-6 w-6" /> Saved Labels ({labels.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && labels.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-20 animate-pulse"></div>
                  </div>
                  <p className="text-lg text-muted-foreground font-medium">Loading labels...</p>
                </div>
              </div>
            ) : labels.length === 0 ? (
              <div className="text-center py-16">
                <Tag className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground font-medium">
                  No labels saved yet. Add your first label above to start filtering services.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {labels.map((label, index) => (
                  <div key={label.id} className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                    index % 2 === 0 
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-700 dark:to-slate-600 border-emerald-200 dark:border-slate-600' 
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-600 dark:to-slate-700 border-blue-200 dark:border-slate-500'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index % 2 === 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}></div>
                        <div>
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <Tag className="h-5 w-5" /> {label.label}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> Created: {new Date(label.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeLabel(label.id)}
                        variant="destructive"
                        size="sm"
                        className="hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> Labels help you quickly filter services by keywords. Select labels on the main page to filter services.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}