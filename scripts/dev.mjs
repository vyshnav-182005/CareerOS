import { spawn } from "node:child_process";
import http from "node:http";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const url = new URL(process.env.CAREEROS_DEV_URL ?? "http://localhost:3000");
const browserUrl = url.toString();
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const scriptDir = dirname(fileURLToPath(import.meta.url));

let browserOpened = false;

function openExternalBrowser() {
  if (browserOpened) {
    return;
  }

  browserOpened = true;

  if (process.platform === "win32") {
    spawn("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Start-Process chrome -ArgumentList @('--new-tab', '${browserUrl}')`
    ], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    }).unref();
    return;
  }

  if (process.platform === "darwin") {
    spawn("open", ["-a", "Google Chrome", browserUrl], {
      detached: true,
      stdio: "ignore"
    }).unref();
    return;
  }

  spawn("xdg-open", [browserUrl], { detached: true, stdio: "ignore" }).unref();
}

function probeServer(onReady, onMissing) {
  const request = http.get({ hostname: url.hostname, port: url.port, path: "/" }, (response) => {
    response.resume();
    onReady();
  });

  request.on("error", () => {
    onMissing();
  });
}

probeServer(
  () => {
    console.log(`✓ Next.js server already running at ${browserUrl}`);
    console.log(`- Local:   ${browserUrl}`);
    console.log(`- Network: http://${url.hostname}:${url.port}`);
    openExternalBrowser();
    process.exit(0);
  },
  () => {
    console.log("Starting Next.js development server...");
    const devProcess = spawn(process.execPath, [nextBin, "dev"], {
      cwd: join(scriptDir, ".."),
      stdio: "inherit"
    });

    const poll = setInterval(() => {
      probeServer(
        () => {
          clearInterval(poll);
          console.log(`\n✓ Next.js server is ready at ${browserUrl}`);
          openExternalBrowser();
        },
        () => {
          // Keep polling until Next is ready.
        }
      );
    }, 500);

    devProcess.on("exit", (code, signal) => {
      clearInterval(poll);
      process.exit(code ?? (signal ? 1 : 0));
    });
  }
);