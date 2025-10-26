const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.NODE_ENV = process.env.NODE_ENV || "test";

const tempMongoDir =
  process.env.MONGOMS_DOWNLOAD_DIR ||
  path.join(os.tmpdir(), "mongodb-memory-server");
if (!fs.existsSync(tempMongoDir)) {
  fs.mkdirSync(tempMongoDir, { recursive: true });
}
process.env.MONGOMS_DOWNLOAD_DIR = tempMongoDir;

const modulesCacheDir = path.join(
  __dirname,
  "node_modules",
  ".cache",
  "mongodb-memory-server"
);

if (fs.existsSync(modulesCacheDir)) {
  const cachedBinaries = fs
    .readdirSync(modulesCacheDir)
    .filter((name) => name.startsWith("mongod-"));

  if (cachedBinaries.length > 0) {
    // Use the newest cached binary available
    const sorted = cachedBinaries.sort((a, b) => b.localeCompare(a));
    const sourceBinary = path.join(modulesCacheDir, sorted[0]);
    const targetBinary = path.join(tempMongoDir, sorted[0]);

    if (!fs.existsSync(targetBinary)) {
      fs.copyFileSync(sourceBinary, targetBinary);
      fs.chmodSync(targetBinary, 0o755);
    }

    process.env.MONGOMS_SYSTEM_BINARY = targetBinary;
  }
}
