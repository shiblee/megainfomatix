/**
 * User model: the only place that knows about the "users" table.
 * Returns plain objects with camelCase keys and never exposes password hashes
 * (except findByEmailWithPassword, used only for login).
 */
const { db } = require('../config/db');

const TABLE = 'users';
const PUBLIC_COLUMNS = ['id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at'];

const toPublic = (row) =>
  row
    ? {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;

const User = {
  tableName: TABLE,

  async findAll({ limit = 20, offset = 0 } = {}) {
    const rows = await db(TABLE).select(PUBLIC_COLUMNS).orderBy('id', 'asc').limit(limit).offset(offset);
    return rows.map(toPublic);
  },

  async count() {
    const [{ total }] = await db(TABLE).count({ total: '*' });
    return Number(total);
  },

  async findById(id) {
    const row = await db(TABLE).select(PUBLIC_COLUMNS).where({ id }).first();
    return toPublic(row);
  },

  async findByEmail(email) {
    const row = await db(TABLE).select(PUBLIC_COLUMNS).where({ email }).first();
    return toPublic(row);
  },

  findByEmailWithPassword(email) {
    return db(TABLE).where({ email }).first();
  },

  async create({ name, email, passwordHash, role = 'user' }) {
    const inserted = await db(TABLE).insert({ name, email, password_hash: passwordHash, role }, ['id']);
    // pg/sqlite return [{ id }], mysql returns [id]
    const id = typeof inserted[0] === 'object' ? inserted[0].id : inserted[0];
    return this.findById(id);
  },

  toPublic,
};

module.exports = User;
