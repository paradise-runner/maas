import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

interface LaunchService {
  pid: string;
  status: string;
  label: string;
}

export async function GET() {
  try {
    const { stdout } = await execAsync('launchctl list');
    
    const lines = stdout.split('\n').slice(1);
    const services: LaunchService[] = [];
    
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const pid = parts[0] === '-' ? 'Not Running' : parts[0];
          const status = parts[1];
          const label = parts.slice(2).join(' ');
          
          services.push({
            pid,
            status,
            label
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