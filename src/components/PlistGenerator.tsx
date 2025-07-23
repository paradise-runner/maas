'use client';

import { useState } from 'react';

interface PlistGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlistData {
  label: string;
  program: string;
  programArguments: string[];
  workingDirectory: string;
  runAtLoad: boolean;
  keepAlive: boolean;
  standardOutPath: string;
  standardErrorPath: string;
  environmentVariables: { [key: string]: string };
}

export default function PlistGenerator({ isOpen, onClose }: PlistGeneratorProps) {
  const [plistData, setPlistData] = useState<PlistData>({
    label: '',
    program: '',
    programArguments: [],
    workingDirectory: '',
    runAtLoad: true,
    keepAlive: false,
    standardOutPath: '',
    standardErrorPath: '',
    environmentVariables: {}
  });

  const [argumentInput, setArgumentInput] = useState('');
  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');

  if (!isOpen) return null;

  const addArgument = () => {
    if (argumentInput.trim()) {
      setPlistData(prev => ({
        ...prev,
        programArguments: [...prev.programArguments, argumentInput.trim()]
      }));
      setArgumentInput('');
    }
  };

  const removeArgument = (index: number) => {
    setPlistData(prev => ({
      ...prev,
      programArguments: prev.programArguments.filter((_, i) => i !== index)
    }));
  };

  const addEnvironmentVariable = () => {
    if (envKey.trim() && envValue.trim()) {
      setPlistData(prev => ({
        ...prev,
        environmentVariables: {
          ...prev.environmentVariables,
          [envKey.trim()]: envValue.trim()
        }
      }));
      setEnvKey('');
      setEnvValue('');
    }
  };

  const removeEnvironmentVariable = (key: string) => {
    setPlistData(prev => {
      const newEnvVars = { ...prev.environmentVariables };
      delete newEnvVars[key];
      return {
        ...prev,
        environmentVariables: newEnvVars
      };
    });
  };

  const generatePlistContent = (): string => {
    // Extract middle part of label for default log names (com.test.dev -> test)
    const labelParts = plistData.label.split('.');
    const logName = labelParts.length >= 3 ? labelParts[1] : (labelParts[0] || 'service');
    
    const standardOutPath = plistData.standardOutPath || `/tmp/${logName}.log`;
    const standardErrorPath = plistData.standardErrorPath || `/tmp/${logName}.error.log`;
    
    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${plistData.label}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${plistData.program}</string>${plistData.programArguments.map(arg => `
        <string>${arg}</string>`).join('')}
    </array>${plistData.workingDirectory ? `
    <key>WorkingDirectory</key>
    <string>${plistData.workingDirectory}</string>` : ''}
    <key>RunAtLoad</key>
    <${plistData.runAtLoad ? 'true' : 'false'}/>
    <key>KeepAlive</key>
    <${plistData.keepAlive ? 'true' : 'false'}/>
    <key>StandardOutPath</key>
    <string>${standardOutPath}</string>
    <key>StandardErrorPath</key>
    <string>${standardErrorPath}</string>${Object.keys(plistData.environmentVariables).length > 0 ? `
    <key>EnvironmentVariables</key>
    <dict>${Object.entries(plistData.environmentVariables).map(([key, value]) => `
        <key>${key}</key>
        <string>${value}</string>`).join('')}
    </dict>` : ''}
</dict>
</plist>`;
    return plist;
  };

  const downloadPlist = () => {
    const content = generatePlistContent();
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plistData.label}.plist`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getInstallCommand = (): string => {
    const filename = `${plistData.label}.plist`;
    return `mv ~/Downloads/${filename} ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/${filename} && launchctl start ${plistData.label}`;
  };

  const copyInstallCommand = async () => {
    try {
      await navigator.clipboard.writeText(getInstallCommand());
      alert('Installation command copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy command:', err);
    }
  };

  const isValid = plistData.label && plistData.program;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Generate LaunchAgent Plist
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Label (Required) *
              </label>
              <input
                type="text"
                value={plistData.label}
                onChange={(e) => setPlistData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="com.example.myservice"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Program Path (Required) *
              </label>
              <input
                type="text"
                value={plistData.program}
                onChange={(e) => setPlistData(prev => ({ ...prev, program: e.target.value }))}
                placeholder="/usr/local/bin/myprogram"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Program Arguments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Program Arguments
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={argumentInput}
                onChange={(e) => setArgumentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addArgument()}
                placeholder="--config /path/to/config"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={addArgument}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {plistData.programArguments.map((arg, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {arg}
                  <button
                    onClick={() => removeArgument(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Working Directory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Working Directory
            </label>
            <input
              type="text"
              value={plistData.workingDirectory}
              onChange={(e) => setPlistData(prev => ({ ...prev, workingDirectory: e.target.value }))}
              placeholder="/path/to/working/directory"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="runAtLoad"
                checked={plistData.runAtLoad}
                onChange={(e) => setPlistData(prev => ({ ...prev, runAtLoad: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="runAtLoad" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                Run at Load
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="keepAlive"
                checked={plistData.keepAlive}
                onChange={(e) => setPlistData(prev => ({ ...prev, keepAlive: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="keepAlive" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                Keep Alive
              </label>
            </div>
          </div>

          {/* Log Paths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Standard Output Path
              </label>
              <input
                type="text"
                value={plistData.standardOutPath}
                onChange={(e) => setPlistData(prev => ({ ...prev, standardOutPath: e.target.value }))}
                placeholder="/tmp/myservice.out"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Standard Error Path
              </label>
              <input
                type="text"
                value={plistData.standardErrorPath}
                onChange={(e) => setPlistData(prev => ({ ...prev, standardErrorPath: e.target.value }))}
                placeholder="/tmp/myservice.err"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Environment Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Environment Variables
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value)}
                placeholder="KEY"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                type="text"
                value={envValue}
                onChange={(e) => setEnvValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEnvironmentVariable()}
                placeholder="value"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={addEnvironmentVariable}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(plistData.environmentVariables).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    <strong>{key}</strong> = {value}
                  </span>
                  <button
                    onClick={() => removeEnvironmentVariable(key)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={downloadPlist}
              disabled={!isValid}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download Plist File
            </button>
            {isValid && (
              <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Installation command:</p>
                  <code className="text-xs text-gray-800 dark:text-gray-200 font-mono break-all">
                    {getInstallCommand()}
                  </code>
                </div>
                <button
                  onClick={copyInstallCommand}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Copy Install Command
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}