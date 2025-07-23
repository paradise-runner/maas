'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LaunchService {
  pid: string;
  status: string;
  label: string;
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
  };

  const filteredServices = selectedLabels.size === 0 
    ? services 
    : services.filter(service => 
        Array.from(selectedLabels).some(selectedLabel => 
          service.label.toLowerCase().includes(selectedLabel.toLowerCase())
        )
      );

  useEffect(() => {
    fetchServices();
    fetchLabels();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            macOS Services (launchctl)
          </h1>
          <div className="flex gap-4">
            <Link
              href="/labels"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Manage Labels
            </Link>
            <button
              onClick={fetchServices}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {savedLabels.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filter by Labels
              </h2>
              {selectedLabels.size > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Clear all ({selectedLabels.size})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {savedLabels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.label)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedLabels.has(label.label)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {label.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {loading && services.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading services...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      PID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Service Label
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredServices.map((service, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            service.pid !== 'Not Running'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}
                        >
                          {service.pid !== 'Not Running' ? 'Running' : 'Stopped'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {service.pid}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {service.label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredServices.length} of {services.length} services
          {selectedLabels.size > 0 && (
            <span className="ml-2">
              (filtered by {selectedLabels.size} label{selectedLabels.size !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
