const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'courses.json');
const STATUSES = ['Not Started', 'In Progress', 'Completed'];

app.use(express.json());

// CORS so a browser dashboard (even opened from file://) can call the API
app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ponytail: whole-file read/write, fine for a learning project, use a database for real traffic
const load = () => {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    throw new Error('courses.json is corrupted');
  }
};
const save = (courses) => fs.writeFileSync(DATA_FILE, JSON.stringify(courses, null, 2));

// Returns an error message, or null when the fields are valid.
// partial=true (PUT) only checks fields that were sent.
const validate = (b, partial) => {
  const isText = (v) => typeof v === 'string' && v.trim() !== '';
  if (!partial || 'name' in b) if (!isText(b.name)) return 'name is required and must be a non-empty string';
  if (!partial || 'description' in b) if (!isText(b.description)) return 'description is required and must be a non-empty string';
  if (!partial || 'target_date' in b) {
    if (typeof b.target_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.target_date) || isNaN(Date.parse(b.target_date))) {
      return 'target_date is required and must be a valid date in YYYY-MM-DD format';
    }
  }
  if (!partial || 'status' in b) if (!STATUSES.includes(b.status)) return `status must be one of: ${STATUSES.join(', ')}`;
  return null;
};

const clean = (b) => ({
  name: b.name?.trim(), description: b.description?.trim(), target_date: b.target_date, status: b.status,
});

app.get('/api/courses', (req, res) => res.status(200).json(load()));

app.get('/api/courses/:id', (req, res) => {
  const course = load().find((c) => c.id === Number(req.params.id));
  if (!course) return res.status(404).json({ error: `Course ${req.params.id} not found` });
  res.status(200).json(course);
});

app.post('/api/courses', (req, res) => {
  const body = req.body || {};
  const error = validate(body, false);
  if (error) return res.status(400).json({ error });
  const courses = load();
  const course = {
    id: courses.reduce((max, c) => Math.max(max, c.id), 0) + 1,
    ...clean(body),
    created_at: new Date().toISOString(),
  };
  courses.push(course);
  save(courses);
  res.status(201).json(course);
});

app.put('/api/courses/:id', (req, res) => {
  const body = req.body || {};
  const error = validate(body, true);
  if (error) return res.status(400).json({ error });
  const courses = load();
  const course = courses.find((c) => c.id === Number(req.params.id));
  if (!course) return res.status(404).json({ error: `Course ${req.params.id} not found` });
  const updates = clean(body);
  for (const key of Object.keys(updates)) if (key in body) course[key] = updates[key];
  save(courses);
  res.status(200).json(course);
});

app.delete('/api/courses/:id', (req, res) => {
  const courses = load();
  const index = courses.findIndex((c) => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: `Course ${req.params.id} not found` });
  const [removed] = courses.splice(index, 1);
  save(courses);
  res.status(200).json({ message: `Course ${removed.id} deleted`, course: removed });
});

// Bad JSON bodies and unexpected failures still return JSON
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON' });
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => console.log(`CodeCraftHub API running at http://localhost:${PORT}`));
