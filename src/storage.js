import fs from "fs";
const FILE = "./storage/replied.json";

export function loadReplied() {
  return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : [];
}

export function saveReplied(ids) {
  fs.writeFileSync(FILE, JSON.stringify(ids, null, 2));
}