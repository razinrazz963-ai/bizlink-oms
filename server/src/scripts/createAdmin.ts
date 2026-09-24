import bcrypt from 'bcryptjs';
import { db } from '../database/store.js';
import { ALL_PERMISSIONS, User } from '../database/schema.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  args.forEach(arg => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      params[match[1]] = match[2];
    }
  });
  return params;
}

const args = parseArgs();
const email = (args.email || process.env.ADMIN_EMAIL || 'admin@bizlink.ae').trim();
const password = args.password || process.env.ADMIN_INITIAL_PASSWORD;
const name = args.name || 'System Administrator';
const phone = args.phone || '';

if (!password) {
  console.error('Error: Password is required.');
  console.log('Usage: npx tsx server/src/scripts/createAdmin.ts --email=admin@bizlink.ae --password=YourSecurePassword123');
  console.log('Or provide via environment variables: ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Error: Password must be at least 6 characters long.');
  process.exit(1);
}

const salt = bcrypt.genSaltSync(10);
const passwordHash = bcrypt.hashSync(password, salt);

const users = db.getUsers();
const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

if (existingUser) {
  existingUser.name = name;
  existingUser.phone = phone;
  existingUser.passwordHash = passwordHash;
  existingUser.role = 'admin';
  existingUser.permissions = [...ALL_PERMISSIONS];
  existingUser.status = 'active';
  db.save();

  db.logActivity(
    existingUser.id,
    existingUser.name,
    existingUser.role,
    'UPDATE_ADMIN',
    'employee',
    `Administrator account '${email}' credentials updated via CLI setup script`
  );

  console.log(`\n======================================================`);
  console.log(` SUCCESS: Administrator account updated successfully.`);
  console.log(` Email       : ${email}`);
  console.log(` Name        : ${name}`);
  console.log(` Role        : System Administrator`);
  console.log(` Status      : active`);
  console.log(` Permissions : Full Access (${ALL_PERMISSIONS.length} permissions)`);
  console.log(`======================================================\n`);
} else {
  const newAdmin: User = {
    id: `usr-admin-${Date.now()}`,
    employeeId: 'BL-EMP-0001',
    name,
    email,
    phone,
    designation: 'System Administrator',
    department: 'Administration',
    role: 'admin',
    permissions: [...ALL_PERMISSIONS],
    passwordHash,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  users.push(newAdmin);
  db.save();

  db.logActivity(
    newAdmin.id,
    newAdmin.name,
    newAdmin.role,
    'CREATE_ADMIN',
    'employee',
    `Administrator account '${email}' initialized via CLI setup script`
  );

  console.log(`\n======================================================`);
  console.log(` SUCCESS: New administrator account created successfully.`);
  console.log(` Email       : ${email}`);
  console.log(` Employee ID : BL-EMP-0001`);
  console.log(` Name        : ${name}`);
  console.log(` Role        : System Administrator`);
  console.log(` Status      : active`);
  console.log(` Permissions : Full Access (${ALL_PERMISSIONS.length} permissions)`);
  console.log(`======================================================\n`);
}
