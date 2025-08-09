import net from 'net';

const host = '103.89.44.240';
const port = 1433;
const timeout = 5000;

console.log(`Testing connectivity to ${host}:${port}...`);

const socket = new net.Socket();

socket.setTimeout(timeout);

socket.on('connect', () => {
  console.log(`✓ Successfully connected to ${host}:${port}`);
  console.log('Port is open and accessible!');
  socket.destroy();
});

socket.on('timeout', () => {
  console.log(`✗ Connection timeout after ${timeout}ms`);
  console.log('The server is not responding or is blocked by firewall');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log(`✗ Connection failed: ${err.message}`);
  if (err.code === 'ECONNREFUSED') {
    console.log('Port is reachable but service is not running');
  } else if (err.code === 'EHOSTUNREACH') {
    console.log('Host is unreachable - check network/VPN connection');
  } else if (err.code === 'ETIMEDOUT') {
    console.log('Connection timed out - firewall may be blocking');
  }
});

socket.connect(port, host);