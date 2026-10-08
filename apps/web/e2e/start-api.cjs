const path = require("node:path");

require(path.resolve(__dirname, "../../api/test/setup-e2e.cjs"));

process.env.PORT = "5100";
process.env.WEB_URL = "http://localhost:3100";

require(path.resolve(__dirname, "../../api/dist/main.js"));
