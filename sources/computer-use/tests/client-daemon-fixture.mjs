// A real child process speaking the retained daemon/proxy protocol. Never loads a driver.
import net from 'node:net';
import readline from 'node:readline';

const { mode, socket, phase } = JSON.parse(process.argv[2]);
const sockets = new Set();
const event = (type, extra = {}) => process.send?.({ type, ...extra });
const answer = (connection, result) => connection.write(JSON.stringify({ ok: true, result }) + '\n');
function stop() { for (const socket of sockets) socket.destroy(); process.exit(0); }
process.on('SIGTERM', stop);
process.stdin.on('end', stop);
if (mode === 'serve') {
  event('serve-start');
  if (phase === 'socket') { process.stdin.resume(); }
  else {
    let owners = 0;
    const server = net.createServer(connection => {
      sockets.add(connection);
      let owner;
      connection.once('close', () => { sockets.delete(connection); event('connection-closed', { owner }); });
      readline.createInterface({ input: connection }).on('line', line => {
        const request = JSON.parse(line);
        if (request.method === 'metadata') {
          event('metadata');
          if (phase !== 'metadata') answer(connection, { embedded: true, driver_version: '0.36.0' });
        } else if (request.method === 'session_begin') {
          owner = request.session_id; event('session-begin', { owner });
          if (phase !== 'session' && !(phase === 'first-session' && owners++ === 0)) answer(connection, { session_begin: true });
        } else if (request.method === 'call') {
          event('call', { name: request.name });
          answer(connection, { content: [], structuredContent: { ok: true } });
        }
      });
    });
    server.listen(socket, () => event('listening'));
  }
} else {
  event('proxy-start');
  readline.createInterface({ input: process.stdin }).on('line', line => {
    const request = JSON.parse(line);
    event(request.method);
    if (request.id && !(phase === 'initialize' && request.method === 'initialize')) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: { content: [], structuredContent: { ok: true } } }) + '\n');
    }
  });
}
