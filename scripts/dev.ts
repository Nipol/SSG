type ProcessSpec = {
  name: string;
  color: string;
  command: [string, ...string[]];
};

type RunningProcess = ProcessSpec & {
  child: Deno.ChildProcess;
  stdoutTask: Promise<void>;
  stderrTask: Promise<void>;
};

type ShutdownRequest = {
  reason: string;
  signal: Deno.Signal;
  code: number;
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const COLORS = {
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
} as const;

const PROCESS_SPECS: ProcessSpec[] = [
  { name: 'start', color: COLORS.cyan, command: ['deno', 'task', 'start'] },
  { name: 'tailwind', color: COLORS.magenta, command: ['deno', 'task', 'tailwind'] },
  { name: 'server', color: COLORS.yellow, command: ['deno', 'task', 'server'] },
];

function processPrefix(process: ProcessSpec): string {
  return `${BOLD}${process.color}[${process.name}]${RESET}`;
}

function devPrefix(color: string = COLORS.gray): string {
  return `${BOLD}${color}[dev]${RESET}`;
}

function logFromProcess(process: ProcessSpec, message: string, isError = false): void {
  const line = `${processPrefix(process)} ${message}`;
  if (isError) console.error(line);
  else console.log(line);
}

async function streamOutput(
  stream: ReadableStream<Uint8Array> | null,
  process: ProcessSpec,
  isError = false,
): Promise<void> {
  if (!stream) return;

  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += value;
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
      buffer = buffer.slice(newlineIndex + 1);
      if (line.length > 0) logFromProcess(process, line, isError);
      newlineIndex = buffer.indexOf('\n');
    }
  }

  const rest = buffer.trim();
  if (rest.length > 0) logFromProcess(process, rest, isError);
}

function startProcess(spec: ProcessSpec): RunningProcess {
  const child = new Deno.Command(spec.command[0], {
    args: spec.command.slice(1),
    stdin: 'inherit',
    stdout: 'piped',
    stderr: 'piped',
    env: Deno.env.toObject(),
  }).spawn();

  return {
    ...spec,
    child,
    stdoutTask: streamOutput(child.stdout, spec, false),
    stderrTask: streamOutput(child.stderr, spec, true),
  };
}

async function waitWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return await Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

async function shutdownAll(
  request: ShutdownRequest,
  running: RunningProcess[],
  onSigInt: () => void,
  onSigTerm: () => void,
): Promise<never> {
  Deno.removeSignalListener('SIGINT', onSigInt);
  Deno.removeSignalListener('SIGTERM', onSigTerm);

  console.log(`${devPrefix()} stopping all processes (${request.reason})`);

  for (const process of running) {
    try {
      process.child.kill(request.signal);
    } catch {
      // Process already exited.
    }
  }

  const gracefulWait = await Promise.all(
    running.map(async (process) => ({
      process,
      status: await waitWithTimeout(process.child.status, 3000),
    })),
  );

  for (const { process, status } of gracefulWait) {
    if (status !== null) continue;
    try {
      process.child.kill('SIGKILL');
    } catch {
      // Process already exited.
    }
  }

  await Promise.allSettled(running.map((process) => process.child.status));
  await Promise.allSettled(running.map((process) => process.stdoutTask));
  await Promise.allSettled(running.map((process) => process.stderrTask));

  Deno.exit(request.code);
}

async function main(): Promise<never> {
  console.log(`${devPrefix()} starting start/tailwind/server`);
  const running = PROCESS_SPECS.map(startProcess);

  let requestShutdown: ((request: ShutdownRequest) => void) | null = null;
  const shutdownRequest = new Promise<ShutdownRequest>((resolve) => {
    requestShutdown = resolve;
  });

  let requested = false;
  const requestOnce = (request: ShutdownRequest): void => {
    if (requested) return;
    requested = true;
    requestShutdown?.(request);
  };

  const onSigInt = (): void => {
    requestOnce({
      reason: 'SIGINT received',
      signal: 'SIGTERM',
      code: 0,
    });
  };

  const onSigTerm = (): void => {
    requestOnce({
      reason: 'SIGTERM received',
      signal: 'SIGTERM',
      code: 0,
    });
  };

  Deno.addSignalListener('SIGINT', onSigInt);
  Deno.addSignalListener('SIGTERM', onSigTerm);

  for (const process of running) {
    process.child.status.then((status) => {
      requestOnce({
        reason: status.success ? `${process.name} exited` : `${process.name} exited with code ${status.code}`,
        signal: 'SIGTERM',
        code: status.success ? 0 : status.code,
      });
    });
  }

  const request = await shutdownRequest;
  if (request.code !== 0) {
    console.error(`${devPrefix(COLORS.red)} ${request.reason}`);
  }
  return await shutdownAll(request, running, onSigInt, onSigTerm);
}

await main();
