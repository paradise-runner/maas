import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { appendFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);
const DEBUG_LOG_PATH = join(process.cwd(), 'debug.log');

async function writeDebugLog(message: string) {
  const timestamp = new Date().toISOString();
  await appendFile(DEBUG_LOG_PATH, `[${timestamp}] ${message}\n`);
}

interface LaunchService {
  pid: string;
  status: string;
  label: string;
  networkUrl?: string;
}

async function getNetworkPortMapping(): Promise<Map<string, string>> {
  const portMap = new Map<string, string>();
  
  try {
    // Get current IP address
    const { stdout: ipOutput } = await execAsync('/sbin/ifconfig | grep "inet " | grep -v 127.0.0.1 | awk \'{print $2}\'');
    const { stdout: ipErrorOutput } = await execAsync('/sbin/ifconfig');
    
    const ipAddress = ipOutput.trim().split('\n')[0];
    if (!ipAddress) return portMap;
    
    // Get processes listening on ports
    const { stdout: lsofOutput } = await execAsync('/usr/sbin/lsof -iTCP -sTCP:LISTEN -n -P');
    
    // Get process hierarchy information
    const { stdout: psOutput } = await execAsync('ps -efj');
    
    const lsofLines = lsofOutput.split('\n').slice(1);
    const psLines = psOutput.split('\n').slice(1);
    
    // Parse process information into a map for quick lookup
    const processMap = new Map<string, { ppid: string, cmd: string }>();
    for (const line of psLines) {
      if (line.trim()) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const pid = parts[1];
          const ppid = parts[2];
          const cmd = parts.slice(7).join(' ');
          processMap.set(pid, { ppid, cmd });
        }
      }
    }
    
    // Parse lsof output to find port mappings
    for (const line of lsofLines) {
      if (line.trim()) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 9) {
          const pid = parts[1];
          const name = parts[8];
          
          // Extract port from name (e.g., "*:3000" or "127.0.0.1:8000")
          const portMatch = name.match(/:(\d+)$/);
          if (portMatch) {
            const port = portMatch[1];
            
            // Skip localhost-only services unless they're common development ports
            if (name.includes('127.0.0.1') && !['3000', '3001', '8000', '8080', '4000', '5000'].includes(port)) {
              continue;
            }
            
            // Find the root process and its command
            let currentPid = pid;
            let processInfo = processMap.get(currentPid);
            
            // Walk up the process tree to find meaningful parent processes
            while (processInfo && processInfo.ppid !== '1' && processInfo.ppid !== '0') {
              const parentInfo = processMap.get(processInfo.ppid);
              if (parentInfo && parentInfo.cmd.includes('launchctl')) {
                break;
              }
              currentPid = processInfo.ppid;
              processInfo = parentInfo;
            }
            
            if (processInfo) {
              const networkUrl = name.includes('127.0.0.1') 
                ? `http://127.0.0.1:${port}` 
                : `http://${ipAddress}:${port}`;
              portMap.set(currentPid, networkUrl);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching network port mapping:', error);
  }
  
  return portMap;
}

export async function GET() {
  try {
    const [{ stdout }, portMap] = await Promise.all([
      execAsync('launchctl list'),
      getNetworkPortMapping()
    ]);
    
    const lines = stdout.split('\n').slice(1);
    const services: LaunchService[] = [];
    
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const pid = parts[0] === '-' ? 'Not Running' : parts[0];
          const status = parts[1];
          const label = parts.slice(2).join(' ');
          
          // Check if this PID has a network URL
          const networkUrl = pid !== 'Not Running' ? portMap.get(pid) : undefined;
          
          services.push({
            pid,
            status,
            label,
            networkUrl
          });
        }
      }
    }
    
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching launchctl services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}