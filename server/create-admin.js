import { MongoClient } from 'mongodb';
import readline from 'node:readline/promises';
import { Writable } from 'node:stream';
import { hashPassword } from './auth.js';
let hidden = false;
const output = new Writable({ write(chunk, encoding, callback) { if (!hidden) process.stdout.write(chunk); callback(); } });
const input = readline.createInterface({ input: process.stdin, output, terminal: true });
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 5000 });
try {
  const email = (await input.question('Admin email: ')).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email.');
  process.stdout.write('Password (12–256 characters; typing is hidden): '); hidden = true;
  const password = await input.question('');
  hidden = false; process.stdout.write('\n');
  if (password.length < 12 || password.length > 256) throw new Error('Password must be 12–256 characters.');
  process.stdout.write('Confirm password: '); hidden = true;
  const confirm = await input.question('');
  hidden = false; process.stdout.write('\n');
  if (password !== confirm) throw new Error('Passwords do not match.');
  await client.connect();
  const admins = client.db(process.env.MONGODB_DB || 'creamycrochets').collection('admins');
  await admins.createIndex({ email: 1 }, { unique: true });
  await admins.insertOne({ email, ...await hashPassword(password), createdAt: new Date() });
  console.log('Admin created. Open http://localhost:5173/admin');
} catch (err) { hidden = false; console.error(err.code === 11000 ? 'That admin already exists; no account was changed.' : err.message); process.exitCode = 1; }
finally { input.close(); await client.close(); }
