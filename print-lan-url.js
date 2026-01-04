const os = require('os');

const DEFAULT_FRONTEND_PORT = process.env.FRONTEND_PORT || 5173;
const DEFAULT_BACKEND_PORT = process.env.BACKEND_PORT || 5000;

const getLanIp = () => {
  const nets = os.networkInterfaces();
  for (const interfaces of Object.values(nets)) {
    for (const net of interfaces || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
};

const ip = getLanIp();

if (!ip) {
  console.log('No LAN IPv4 address detected.');
  console.log('Make sure you are connected to Wi-Fi or Ethernet.');
  process.exit(1);
}

console.log('Open these on your phone (same Wi-Fi):');
console.log(`Frontend: http://${ip}:${DEFAULT_FRONTEND_PORT}`);
console.log(`Backend:  http://${ip}:${DEFAULT_BACKEND_PORT}`);
