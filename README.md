# CodeCraftHub

A small personalized learning platform. It has a REST API for managing course listings (Node.js + Express, data saved in a JSON file, no database) and a single-page dashboard (`index.html`) that uses the API.

## Requirements

- Node.js 18 or newer
- npm
- curl (only for testing)

## Run it

```bash
npm install
npm start
```

The API runs at `http://localhost:5000`. Then open `index.html` in your browser to use the dashboard.

## Course fields

| Field | Rules |
|-------|-------|
| `name` | required, non-empty text |
| `description` | required, non-empty text |
| `target_date` | required, `YYYY-MM-DD` |
| `status` | required, one of `Not Started`, `In Progress`, `Completed` |

The server adds `id` and `created_at`. Courses are stored in `courses.json` (created on first save).

## Endpoints

| Method | URL | What it does | Success |
|--------|-----|--------------|---------|
| GET | `/api/courses` | list all courses | 200 |
| GET | `/api/courses/:id` | get one course | 200 |
| POST | `/api/courses` | create a course | 201 |
| PUT | `/api/courses/:id` | update any of the fields | 200 |
| DELETE | `/api/courses/:id` | delete a course | 200 |

Errors always come back as JSON: `{ "error": "message" }` with status 400 (bad input) or 404 (not found). CORS is enabled for all origins so the dashboard can call the API from a browser.

## Try it with curl

```bash
curl -X POST http://localhost:5000/api/courses -H "Content-Type: application/json" \
  -d '{"name":"Intro to Node","description":"Learn Express basics","target_date":"2026-12-31","status":"In Progress"}'
curl http://localhost:5000/api/courses
curl -X PUT http://localhost:5000/api/courses/1 -H "Content-Type: application/json" -d '{"status":"Completed"}'
curl -X DELETE http://localhost:5000/api/courses/1
```

## Troubleshooting

- **Dashboard says "Cannot reach the API"**: start the backend with `npm start` and check it is on port 5000.
- **`EADDRINUSE` on startup**: something else uses port 5000. Stop it, or run `PORT=5001 npm start` and change `API` at the top of the script in `index.html`.
- **"courses.json is corrupted"**: fix or delete `courses.json` (deleting it removes all courses).
