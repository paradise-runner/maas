'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { X, Copy, Sparkles, Settings, Tag, Folder, FileText, FolderOpen, Lightbulb, Play, RotateCcw, Download, Plus } from 'lucide-react';

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
      toast.success('Installation command copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy command:', err);
      toast.error('Failed to copy command to clipboard');
    }
  };

  const isValid = plistData.label && plistData.program;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6 border-b">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="h-8 w-8" /> Generate LaunchAgent Plist
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Create a macOS LaunchAgent configuration file for your service
          </p>
        </DialogHeader>

        <div className="space-y-8">
          {/* Basic Info Section */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border-2 border-purple-200 dark:border-slate-600">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="h-6 w-6" /> Basic Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="service-label" className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Service Label (Required) *
                </Label>
                <Input
                  id="service-label"
                  type="text"
                  value={plistData.label}
                  onChange={(e) => setPlistData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="com.example.myservice"
                  className="border-2 focus:border-purple-500 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-path" className="text-sm font-semibold flex items-center gap-2">
                  <Folder className="h-4 w-4" /> Program Path (Required) *
                </Label>
                <Input
                  id="program-path"
                  type="text"
                  value={plistData.program}
                  onChange={(e) => setPlistData(prev => ({ ...prev, program: e.target.value }))}
                  placeholder="/usr/local/bin/myprogram"
                  className="border-2 focus:border-purple-500 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Program Arguments Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-6 border-2 border-blue-200 dark:border-slate-500">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6" /> Program Arguments
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Input
                  type="text"
                  value={argumentInput}
                  onChange={(e) => setArgumentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addArgument()}
                  placeholder="--config /path/to/config"
                  className="flex-1 border-2 focus:border-blue-500 transition-all duration-300"
                />
                <Button 
                  onClick={addArgument} 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {plistData.programArguments.map((arg, index) => (
                  <Badge key={index} variant="secondary" className="gap-2 text-sm py-1 px-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-slate-600 dark:to-slate-500 border border-blue-300 dark:border-slate-400">
                    {arg}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArgument(index)}
                      className="h-auto p-0 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Working Directory Section */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-6 border-2 border-emerald-200 dark:border-slate-500">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FolderOpen className="h-6 w-6" /> Working Directory
            </h3>
            <div className="space-y-2">
              <Input
                id="working-dir"
                type="text"
                value={plistData.workingDirectory}
                onChange={(e) => setPlistData(prev => ({ ...prev, workingDirectory: e.target.value }))}
                placeholder="/path/to/working/directory"
                className="border-2 focus:border-emerald-500 transition-all duration-300"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lightbulb className="h-3 w-3" /> Optional: Directory where the program should run
              </p>
            </div>
          </div>

          {/* Service Options Section */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-6 border-2 border-amber-200 dark:border-slate-500">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="h-6 w-6" /> Service Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border">
                <Checkbox
                  id="runAtLoad"
                  checked={plistData.runAtLoad}
                  onCheckedChange={(checked) => setPlistData(prev => ({ ...prev, runAtLoad: !!checked }))}
                  className="border-2"
                />
                <div>
                  <Label htmlFor="runAtLoad" className="font-semibold flex items-center gap-2">
                    <Play className="h-4 w-4" /> Run at Load
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Start service when system boots
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border">
                <Checkbox
                  id="keepAlive"
                  checked={plistData.keepAlive}
                  onCheckedChange={(checked) => setPlistData(prev => ({ ...prev, keepAlive: !!checked }))}
                  className="border-2"
                />
                <div>
                  <Label htmlFor="keepAlive" className="font-semibold flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" /> Keep Alive
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Restart if service crashes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Log Paths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stdout-path">Standard Output Path</Label>
              <Input
                id="stdout-path"
                type="text"
                value={plistData.standardOutPath}
                onChange={(e) => setPlistData(prev => ({ ...prev, standardOutPath: e.target.value }))}
                placeholder="/tmp/myservice.out"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stderr-path">Standard Error Path</Label>
              <Input
                id="stderr-path"
                type="text"
                value={plistData.standardErrorPath}
                onChange={(e) => setPlistData(prev => ({ ...prev, standardErrorPath: e.target.value }))}
                placeholder="/tmp/myservice.err"
              />
            </div>
          </div>

          {/* Environment Variables */}
          <div className="space-y-2">
            <Label>Environment Variables</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value)}
                placeholder="KEY"
                className="flex-1"
              />
              <Input
                type="text"
                value={envValue}
                onChange={(e) => setEnvValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEnvironmentVariable()}
                placeholder="value"
                className="flex-1"
              />
              <Button onClick={addEnvironmentVariable} className="bg-green-600 hover:bg-green-700">
                Add
              </Button>
            </div>
            <div className="space-y-2 mt-2">
              {Object.entries(plistData.environmentVariables).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">
                    <strong>{key}</strong> = {value}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEnvironmentVariable(key)}
                    className="h-auto p-1 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Actions Section */}
        <div className="pt-8 border-t-2 border-dashed">
          <div className="flex flex-col gap-6">
            <Button
              onClick={downloadPlist}
              disabled={!isValid}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 py-3 text-lg font-semibold"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Plist File
            </Button>
            {isValid && (
              <div className="relative">
                <div className="bg-slate-900 dark:bg-slate-950 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
                  {/* Code block header */}
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-2">
                        Installation Command
                      </span>
                    </div>
                    <Button
                      onClick={copyInstallCommand}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* Code content */}
                  <div className="p-4">
                    <code className="text-sm font-mono text-green-400 dark:text-green-300 block leading-relaxed">
                      {getInstallCommand()}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}