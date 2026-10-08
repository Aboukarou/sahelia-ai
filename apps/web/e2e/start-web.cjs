const path = require("node:path");

process.env.NODE_ENV = "development";
process.env.SAHELIA_BROWSER_TEST = "1";
process.env.NEXT_PUBLIC_API_URL = "http://localhost:5100/api";

process.chdir(path.resolve(__dirname, ".."));

const nextCli = require.resolve("next/dist/bin/next");

process.argv = [
  process.execPath,
  nextCli,
  "dev",
  "--port",
  "3100",
  "--hostname",
  "localhost",
];

require(nextCli);
