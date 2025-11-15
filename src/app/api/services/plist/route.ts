import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Try common plist locations for LaunchAgents/Daemons
const PLIST_PATHS = [
  '/Library/LaunchAgents',
  '/Library/LaunchDaemons',
  '/System/Library/LaunchAgents',
  '/System/Library/LaunchDaemons',
  `${process.env.HOME}/Library/LaunchAgents`
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const label = url.searchParams.get('label');
    if (!label) {
      return NextResponse.json({ error: 'Missing label' }, { status: 400 });
    }

    // Use launchctl to locate the plist if available
    try {
      // `launchctl print system/<label>` can sometimes show path, but use `launchctl print` for the service
      const { stdout } = await execAsync(`launchctl print ${label}`);
      // try to find a path in stdout
      const pathMatch = stdout.match(/(\/[^\s]+\.plist)/);
      if (pathMatch) {
        const foundPath = pathMatch[1];
        try {
          const contents = await readFile(foundPath, 'utf8');
          return NextResponse.json({ path: foundPath, contents });
        } catch (e) {
          return NextResponse.json({ path: foundPath, contents: null });
        }
      }
    } catch (e) {
      // ignore launchctl print failures and fallback to searching common dirs
    }

    // Fallback: look for a plist file whose filename contains the label
    for (const base of PLIST_PATHS) {
      try {
        const candidate = join(base, `${label}.plist`);
        try {
          const contents = await readFile(candidate, 'utf8');
          return NextResponse.json({ path: candidate, contents });
        } catch (e) {
          // not found, continue
        }
        // Some plists may have prefixes or suffixes; try to find files containing label
        // Use shell `ls` to attempt globbing
        try {
          const { stdout } = await execAsync(`ls ${base} | grep "${label}" | head -n 1`);
          const file = stdout.trim();
          if (file) {
            const candidate2 = join(base, file);
            try {
              const contents2 = await readFile(candidate2, 'utf8');
              return NextResponse.json({ path: candidate2, contents: contents2 });
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          // ignore grep failures
        }
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({ path: null, contents: null });
  } catch (error) {
    console.error('Error looking up plist:', error);
    return NextResponse.json({ error: 'Failed to lookup plist' }, { status: 500 });
  }
}
