import net from 'node:net';

export function findAvailablePort(host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.once('error', reject);
    probe.listen(0, host, () => {
      const address = probe.address();
      const port = typeof address === 'object' && address ? address.port : null;
      probe.close(error => {
        if (error) reject(error);
        else if (!port) reject(new Error('Could not allocate an ephemeral port'));
        else resolve(port);
      });
    });
  });
}

export function waitForChildExit(child, timeoutMs = 3000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);

  return new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.off('exit', onExit);
      child.off('error', onError);
      resolve(value);
    };
    const onExit = () => finish(true);
    const onError = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    child.once('exit', onExit);
    child.once('error', onError);
  });
}

export async function terminateChild(child, { graceMs = 3000 } = {}) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  child.kill('SIGTERM');
  if (await waitForChildExit(child, graceMs)) return;

  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  await waitForChildExit(child, Math.min(graceMs, 1000));
}

export function waitForServerBound(child, { expectedPort, timeoutMs = 5000 } = {}) {
  const streams = [child?.stdout, child?.stderr].filter(Boolean);
  if (!streams.length) return Promise.reject(new Error('Owned server output is unavailable'));
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.reject(new Error(`Owned server already exited with code ${child.exitCode}`));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let output = '';
    const finish = (error, port) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      streams.forEach(stream => stream.off('data', onData));
      child.off('exit', onExit);
      child.off('error', onError);
      if (error) reject(error);
      else resolve(port);
    };
    const onData = chunk => {
      output += chunk.toString();
      const match = output.match(/Serving HTTP on 127\.0\.0\.1 port (\d+)/);
      if (!match) return;
      const port = Number(match[1]);
      if (expectedPort && port !== expectedPort) {
        finish(new Error(`Owned server bound unexpected port ${port}; expected ${expectedPort}`));
      } else {
        finish(null, port);
      }
    };
    const onExit = (code, signal) => finish(new Error(
      `Owned server exited before binding (code=${code}, signal=${signal}): ${output.trim()}`,
    ));
    const onError = error => finish(new Error(`Owned server failed to spawn: ${error.message}`));
    const timer = setTimeout(() => finish(new Error(
      `Owned server bind timed out after ${timeoutMs}ms: ${output.trim()}`,
    )), timeoutMs);

    streams.forEach(stream => stream.on('data', onData));
    child.once('exit', onExit);
    child.once('error', onError);
  });
}
