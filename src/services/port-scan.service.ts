import net from "net";

const COMMON_PORTS = [
  21,   // FTP
  22,   // SSH
  25,   // SMTP
  53,   // DNS
  80,   // HTTP
  110,  // POP3
  143,  // IMAP
  443,  // HTTPS
  3306, // MySQL
  5432, // PostgreSQL
  8080, // Alternate HTTP
];

const checkPort = (
  host: string,
  port: number
): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(1500);

    socket.connect(port, host, () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
};

export const scanPorts = async (
  host: string
) => {
  const results = await Promise.all(
    COMMON_PORTS.map(async (port) => ({
      port,
      open: await checkPort(host, port),
    }))
  );

  return {
    openPorts: results
      .filter((p) => p.open)
      .map((p) => p.port),

    closedPorts: results
      .filter((p) => !p.open)
      .map((p) => p.port),
  };
};