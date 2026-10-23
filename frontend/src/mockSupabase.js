// ================================================================
// MOCK SUPABASE CLIENT
// Mirrors the real @supabase/supabase-js query API so every page
// works without a real database.
// ================================================================

import {
  MOCK_DEPARTMENTS, MOCK_CLASSES, MOCK_DIVISIONS, MOCK_SUBJECTS,
  MOCK_TEACHERS, MOCK_TEACHER_ASSIGNMENTS, MOCK_STUDENTS,
  MOCK_STUDENT_ENROLLMENTS, MOCK_TIMETABLE, MOCK_SESSIONS,
  MOCK_ATTENDANCE_RECORDS, MOCK_SYSTEM_SETTINGS, MOCK_USERS,
} from "./mockData";

// ── in-memory stores (mutable) ──
let departments       = JSON.parse(JSON.stringify(MOCK_DEPARTMENTS));
let classes           = JSON.parse(JSON.stringify(MOCK_CLASSES));
let divisions         = JSON.parse(JSON.stringify(MOCK_DIVISIONS));
let subjects          = JSON.parse(JSON.stringify(MOCK_SUBJECTS));
let teachers          = JSON.parse(JSON.stringify(MOCK_TEACHERS));
let teacherAssignments = JSON.parse(JSON.stringify(MOCK_TEACHER_ASSIGNMENTS));
let students          = JSON.parse(JSON.stringify(MOCK_STUDENTS));
let enrollments       = JSON.parse(JSON.stringify(MOCK_STUDENT_ENROLLMENTS));
let timetable         = JSON.parse(JSON.stringify(MOCK_TIMETABLE));
let sessions          = JSON.parse(JSON.stringify(MOCK_SESSIONS));
let attendanceRecords = JSON.parse(JSON.stringify(MOCK_ATTENDANCE_RECORDS));
let systemSettings    = JSON.parse(JSON.stringify(MOCK_SYSTEM_SETTINGS));

const TABLE_MAP = {
  departments,
  classes,
  divisions,
  subjects,
  teachers,
  teacher_assignments: teacherAssignments,
  students,
  student_enrollments: enrollments,
  timetable,
  attendance_sessions: sessions,
  attendance_records:  attendanceRecords,
  system_settings:     systemSettings,
};

function getTable(name) {
  return TABLE_MAP[name] || [];
}

function setTable(name, arr) {
  TABLE_MAP[name] = arr;
  // keep references in sync
  if (name === "departments")        departments       = arr;
  if (name === "classes")            classes           = arr;
  if (name === "divisions")          divisions         = arr;
  if (name === "subjects")           subjects          = arr;
  if (name === "teachers")           teachers          = arr;
  if (name === "teacher_assignments") teacherAssignments = arr;
  if (name === "students")           students          = arr;
  if (name === "student_enrollments") enrollments      = arr;
  if (name === "timetable")          timetable         = arr;
  if (name === "attendance_sessions") sessions         = arr;
  if (name === "attendance_records") attendanceRecords = arr;
  if (name === "system_settings")    systemSettings    = arr;
}

function uuid() {
  return "mock-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now();
}

// ── Simple query builder ──
class QueryBuilder {
  constructor(tableName) {
    this._table   = tableName;
    this._filters = [];
    this._inFilters = [];
    this._orderBy = null;
    this._orderAsc = true;
    this._limit   = null;
    this._isSingle = false;
    this._isMaybeSingle = false;
    this._isHead   = false;
    this._isCount  = false;
    this._selectStr = "*";
    this._insertData = null;
    this._updateData = null;
    this._upsertData = null;
    this._deleteMode = false;
  }

  select(str = "*", opts = {}) {
    this._selectStr = str;
    if (opts.count === "exact") this._isCount = true;
    if (opts.head)              this._isHead  = true;
    return this;
  }

  eq(col, val)  { this._filters.push({ col, val, op: "eq"  }); return this; }
  neq(col, val) { this._filters.push({ col, val, op: "neq" }); return this; }
  gte(col, val) { this._filters.push({ col, val, op: "gte" }); return this; }
  lte(col, val) { this._filters.push({ col, val, op: "lte" }); return this; }
  in(col, arr)  { this._inFilters.push({ col, arr }); return this; }

  order(col, opts = {}) {
    this._orderBy  = col;
    this._orderAsc = !opts.ascending === false;
    return this;
  }

  limit(n) { this._limit = n; return this; }

  single()      { this._isSingle = true; return this; }
  maybeSingle() { this._isMaybeSingle = true; return this; }

  insert(data) { this._insertData = data; return this; }
  update(data) { this._updateData = data; return this; }
  upsert(data, opts) { this._upsertData = data; this._upsertOpts = opts; return this; }
  delete() { this._deleteMode = true; return this; }

  // Execute and return a promise
  then(resolve, reject) {
    return Promise.resolve(this._execute()).then(resolve, reject);
  }

  _execute() {
    try {
      // ── INSERT ──
      if (this._insertData) {
        const rows = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
        const inserted = rows.map(r => ({ ...r, id: r.id || uuid(), created_at: new Date().toISOString() }));
        const table = getTable(this._table);
        setTable(this._table, [...table, ...inserted]);
        if (this._isSingle) return { data: inserted[0], error: null };
        return { data: inserted, error: null };
      }

      // ── UPSERT ──
      if (this._upsertData) {
        const rows = Array.isArray(this._upsertData) ? this._upsertData : [this._upsertData];
        const onConflict = this._upsertOpts?.onConflict;
        let table = [...getTable(this._table)];
        rows.forEach(row => {
          let matchIdx = -1;
          if (onConflict) {
            const keys = onConflict.split(",").map(k => k.trim());
            matchIdx = table.findIndex(r => keys.every(k => r[k] === row[k]));
          } else if (row.id) {
            matchIdx = table.findIndex(r => r.id === row.id);
          }
          if (matchIdx >= 0) {
            table[matchIdx] = { ...table[matchIdx], ...row, updated_at: new Date().toISOString() };
          } else {
            table.push({ ...row, id: row.id || uuid(), created_at: new Date().toISOString() });
          }
        });
        setTable(this._table, table);
        return { data: rows, error: null };
      }

      // ── UPDATE ──
      if (this._updateData) {
        let table = [...getTable(this._table)];
        const filtered = this._applyFilters(table);
        table = table.map(r => {
          if (filtered.find(f => f.id === r.id)) {
            return { ...r, ...this._updateData, updated_at: new Date().toISOString() };
          }
          return r;
        });
        setTable(this._table, table);
        return { data: null, error: null };
      }

      // ── DELETE ──
      if (this._deleteMode) {
        const table = getTable(this._table);
        const filtered = this._applyFilters(table);
        const filteredIds = new Set(filtered.map(r => r.id));
        setTable(this._table, table.filter(r => !filteredIds.has(r.id)));
        return { data: null, error: null };
      }

      // ── SELECT ──
      let data = this._applyFilters(getTable(this._table));

      // in() filters
      this._inFilters.forEach(({ col, arr }) => {
        data = data.filter(r => arr.includes(r[col]));
      });

      // order
      if (this._orderBy) {
        const col = this._orderBy;
        data = [...data].sort((a, b) => {
          const av = a[col], bv = b[col];
          if (av == null) return 1;
          if (bv == null) return -1;
          return this._orderAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });
      }

      // limit
      if (this._limit) data = data.slice(0, this._limit);

      // count / head
      if (this._isCount && this._isHead) return { count: data.length, data: null, error: null };
      if (this._isCount)                 return { count: data.length, data, error: null };

      // single / maybeSingle
      if (this._isSingle)      return { data: data[0] || null, error: null };
      if (this._isMaybeSingle) return { data: data[0] || null, error: null };

      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: err.message } };
    }
  }

  _applyFilters(data) {
    return data.filter(row => {
      return this._filters.every(({ col, val, op }) => {
        const rv = row[col];
        if (op === "eq")  return rv === val;
        if (op === "neq") return rv !== val;
        if (op === "gte") return rv >= val;
        if (op === "lte") return rv <= val;
        return true;
      });
    });
  }
}

// ── Mock Auth ──
let currentUser = null;
const authListeners = []; // registered onAuthStateChange callbacks

function notifyListeners(event, session) {
  authListeners.forEach(cb => cb(event, session));
}

const mockAuth = {
  getSession() {
    const stored = sessionStorage.getItem("mock_user");
    if (stored) currentUser = JSON.parse(stored);
    return Promise.resolve({
      data: { session: currentUser ? { user: currentUser } : null },
      error: null,
    });
  },

  onAuthStateChange(callback) {
    authListeners.push(callback);
    // Fire immediately with current state
    const stored = sessionStorage.getItem("mock_user");
    if (stored) currentUser = JSON.parse(stored);
    setTimeout(() => {
      callback("INITIAL_SESSION", currentUser ? { user: currentUser } : null);
    }, 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const idx = authListeners.indexOf(callback);
            if (idx !== -1) authListeners.splice(idx, 1);
          },
        },
      },
    };
  },

  signInWithPassword({ email, password }) {
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!user) {
      return Promise.resolve({ data: null, error: { message: "Invalid email or password." } });
    }
    currentUser = { id: user.id, email: user.email };
    sessionStorage.setItem("mock_user", JSON.stringify(currentUser));
    // Notify AuthContext that auth state changed → triggers loadProfile → sets role
    notifyListeners("SIGNED_IN", { user: currentUser });
    return Promise.resolve({ data: { user: currentUser }, error: null });
  },

  signUp({ email, password }) {
    const existing = MOCK_USERS.find(u => u.email === email);
    if (existing) return Promise.resolve({ data: null, error: { message: "Email already in use." } });
    const newUser = { id: uuid(), email, password, role: "teacher", teacher_id: null };
    MOCK_USERS.push(newUser);
    return Promise.resolve({ data: { user: { id: newUser.id, email: newUser.email } }, error: null });
  },

  signOut() {
    currentUser = null;
    sessionStorage.removeItem("mock_user");
    notifyListeners("SIGNED_OUT", null);
    return Promise.resolve({ error: null });
  },
};

// ── Mock Supabase client ──
export const mockSupabase = {
  auth: mockAuth,

  from(tableName) {
    return new QueryBuilder(tableName);
  },
};

// Patch user_roles to understand mock user IDs
// The QueryBuilder reads from TABLE_MAP which doesn't have user_roles —
// we handle it specially via AuthContext reading mock users directly.
mockSupabase._getMockUserRole = function(userId) {
  const u = MOCK_USERS.find(u => u.id === userId);
  return u ? u.role : null;
};

mockSupabase._getMockTeacherId = function(userId) {
  const u = MOCK_USERS.find(u => u.id === userId);
  return u ? u.teacher_id : null;
};
