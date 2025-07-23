'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlistGenerator from '../components/PlistGenerator';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            MaaS - Mac as a Server
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowPlistGenerator(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create Plist
            </button>
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

        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Services
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by service name, PID, or status..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-6 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {savedLabels.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filter by Labels
              </h2>
              <button
                onClick={toggleAllServices}
                className="text-sm px-3 py-1 rounded-md bg-gray-600 text-white hover:bg-gray-700"
              >
                {showAllServices ? 'Reset to Saved Labels' : 'Clear Label Selection'}
              </button>
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
          {searchQuery && (
            <span className="ml-2">(searched for "{searchQuery}")</span>
          )}
          {!searchQuery && selectedLabels.size > 0 && (
            <span className="ml-2">
              (filtered by {selectedLabels.size} label{selectedLabels.size !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        <PlistGenerator
          isOpen={showPlistGenerator}
          onClose={() => setShowPlistGenerator(false)}
        />
      </div>
    </div>
  );
}
