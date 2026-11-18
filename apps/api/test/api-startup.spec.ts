import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';

const API_ROOT = path.join(__dirname, '..');
const STARTUP_TIMEOUT_MS = 20_000;

async function waitForHealth(port: number): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // process still booting
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`API did not become healthy on port ${port}`);
}

function stopProcess(child: ChildProcess) {
  if (!child.killed) {
    child.kill('SIGTERM');
  }
}

describe('API startup', () => {
  it(
    'serves health from the compiled production entrypoint',
    async () => {
      const port = 3100 + Math.floor(Math.random() * 200);
      const child = spawn('node', ['dist/main.js'], {
        cwd: API_ROOT,
        env: {
          ...process.env,
          PORT: String(port),
          NODE_ENV: 'test',
        },
        stdio: 'pipe',
      });

      let stderr = '';
      child.stderr?.on('data', (chunk) => {
        stderr += String(chunk);
      });

      try {
        await waitForHealth(port);
      } catch (error) {
        stopProcess(child);
        throw new Error(
          `${error instanceof Error ? error.message : error}\n${stderr}`,
        );
      } finally {
        stopProcess(child);
      }
    },
    STARTUP_TIMEOUT_MS + 5_000,
  );
});
