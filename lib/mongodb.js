import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI environment variable. Copy .env.example to .env.local " +
      "and fill in your MongoDB Atlas connection string before running the app."
  );
}

const uri = process.env.MONGODB_URI;

// `family: 4` forces IPv4-only connections. Some networks resolve Atlas's
// hostnames to a NAT64-synthesized IPv6 address that's unreachable
// (ENETUNREACH / ETIMEDOUT to a 64:ff9b::... address) even though a normal
// IPv4 route works fine — this is MongoDB's own documented fix for that:
// https://www.mongodb.com/docs/drivers/node/current/connect/connection-troubleshooting/
const options = { family: 4 };

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Reuse the connection across hot-reloads in dev so we don't open a new
  // one on every file save.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
