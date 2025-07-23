'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage Service Labels
          </h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Services
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Add New Label
          </h2>
          <form onSubmit={addLabel} className="flex gap-4">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Enter label name (e.g., 'docker', 'database', 'web')"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={adding}
            />
            <button
              type="submit"
              disabled={adding || !newLabel.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'Adding...' : 'Add Label'}
            </button>
          </form>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Labels are used to filter services on the main page. Add keywords that appear in service names you want to group together.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Saved Labels ({labels.length})
            </h2>
          </div>

          {loading && labels.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading labels...</p>
            </div>
          ) : labels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No labels saved yet. Add your first label above to start filtering services.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {labels.map((label) => (
                <div key={label.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {label.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created: {new Date(label.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeLabel(label.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Labels help you quickly filter services by keywords. When you select labels on the main page,
            only services containing those keywords will be displayed.
          </p>
        </div>
      </div>
    </div>
  );
}