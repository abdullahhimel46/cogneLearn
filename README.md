# cogneLearn — AI-Powered Adaptive Learning Platform

> cogneLearn is an AI-powered adaptive learning platform that integrates YouTube playlist management with real-time attention monitoring, Pomodoro-based study sessions, and productivity analytics — all backed by a secure, session-authenticated Spring Boot REST API.

---

## 📐 Architecture

```
┌────────────────────────────────────────────────────────┐
│                     Browser (Frontend)                   │
│  HTML5 · Vanilla CSS · Vanilla JS · Chart.js · face-api  │
└───────────────────────────┬────────────────────────────┘
                            │  REST API (JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│              Spring Boot 3 Backend (Port 8081)          │
│                                                         │
│  Controllers → Services → Repositories → H2 Database   │
│                                                         │
│  Spring Security 6  ·  Spring Data JPA  ·  Hibernate   │
└────────────────────────────────────────────────────────┘
```

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| **Backend**   | Java 21, Spring Boot 3.3.5                      |
| **Frontend**  | HTML5, Vanilla CSS, Vanilla JavaScript, Chart.js |
| **Database**  | H2 (file-based), Spring Data JPA, Hibernate     |
| **Security**  | Spring Security 6, BCrypt, Session-based auth   |
| **Email**     | Spring Mail (SMTP / NoOp fallback)              |
| **DevOps**    | Gradle 9, embedded Tomcat                       |

---

## 🚀 Features

- **YouTube Playlist Manager** — Import any YouTube video or playlist URL, organize into custom study playlists
- **Distraction-Free Player** — Embedded YouTube player stripped of recommendations and comments
- **Pomodoro Timer** — Configurable work/break cycles with multi-session tracking
- **AI Attention Monitor** — Real-time face-detection (face-api.js, runs 100% in-browser) scores focus every 1.5 s
- **Productivity Analytics** — Focus heatmap, streaks, completion rate, average attention, charts
- **Admin Panel** — User management, activity logs, email campaigns, system overview
- **Motivational Email Campaigns** — Admin-triggered or event-based emails (streak milestones, inactivity)
- **Dark / Light Mode** — Persisted theme preference across all pages

---

## 🏃 Quick Start

### Prerequisites
- Java 21+
- Gradle (wrapper included — no installation required)

### Run locally

```bash
# Clone the repo
git clone https://github.com/abdullahhimel46/cogneLearn.git
cd cogneLearn

# Start the server
./gradlew bootRun          # Linux / macOS
gradlew.bat bootRun        # Windows
```

The app starts on **http://localhost:8081**

| URL                            | Description                  |
|--------------------------------|------------------------------|
| `http://localhost:8081/`       | Landing page                 |
| `http://localhost:8081/pages/login.html`  | Login / Signup    |
| `http://localhost:8081/pages/dashboard.html` | User Dashboard   |
| `http://localhost:8081/pages/admin.html`  | Admin Panel       |
| `http://localhost:8081/swagger-ui.html`   | Swagger UI (API Docs) |
| `http://localhost:8081/h2-console`        | H2 DB Console     |
| `http://localhost:8081/health`            | Health check      |

### Demo credentials (seeded automatically)

| Role  | Email                       | Password   |
|-------|-----------------------------|------------|
| Admin | `admin@cognelearn.app`      | `admin123` |
| User  | `himel@cognelearn.app`      | `password` |
| User  | `nadia@example.com`         | `password` |

---

## 🔐 Security

- **Session-based authentication** — no JWTs; Spring sets a `JSESSIONID` cookie on login
- **BCrypt password hashing** — all passwords stored as one-way hashes
- **CSRF** — disabled only for `/api/**` JSON endpoints (safe: Same-Origin policy)
- **Role-based access** — `ROLE_USER` and `ROLE_ADMIN` enforced via `@PreAuthorize`
- Session timeout: **8 hours**

---

## 📡 REST API Overview

All endpoints under `/api/v1/**` require an active session cookie (except auth endpoints).

| Method | Path                                    | Description                    |
|--------|-----------------------------------------|--------------------------------|
| POST   | `/api/v1/auth/signup`                   | Register new user              |
| POST   | `/api/v1/auth/login`                    | Login                          |
| POST   | `/api/v1/auth/logout`                   | Logout (Spring Security)       |
| GET    | `/api/v1/auth/me`                       | Get current user               |
| GET    | `/api/v1/playlists`                     | List user playlists            |
| POST   | `/api/v1/playlists`                     | Create playlist                |
| PATCH  | `/api/v1/playlists/{id}`               | Update playlist                |
| DELETE | `/api/v1/playlists/{id}`               | Delete playlist                |
| GET    | `/api/v1/sessions`                      | List study sessions            |
| POST   | `/api/v1/sessions`                      | Start session                  |
| PATCH  | `/api/v1/sessions/{id}/complete`       | Complete session               |
| POST   | `/api/v1/sessions/{id}/attention`      | Submit attention score         |
| GET    | `/api/v1/analytics/dashboard`          | Dashboard stats                |
| GET    | `/api/admin/stats`                      | Admin stats (ADMIN only)       |
| GET    | `/api/admin/users`                      | All users (ADMIN only)         |

### 📖 Interactive API Documentation (Swagger)

The project features built-in interactive API documentation using **Springdoc OpenAPI**. When the server is running, you can access:
- **Swagger UI:** [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html) to interact with and test the REST endpoints directly in the browser.
- **OpenAPI Spec (JSON):** [http://localhost:8081/v3/api-docs](http://localhost:8081/v3/api-docs) to retrieve the raw OpenAPI spec schema.

---

## ⚙️ Configuration

`src/main/resources/application.yml`:

```yaml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:h2:file:./data/cognelearn;AUTO_SERVER=TRUE
  jpa:
    hibernate:
      ddl-auto: update

cognelearn:
  email:
    enabled: false   # set true + set MAIL_USERNAME / MAIL_PASSWORD env vars to send real emails
```

### Email (optional)
Set these environment variables to enable SMTP:
```
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password
COGNELEARN_EMAIL_ENABLED=true
```

---

## 🗂️ Project Structure

```
src/main/
├── java/com/abd/cognelearn/
│   ├── config/          # SecurityConfig, DataInitializer
│   ├── controller/      # REST controllers (Auth, Playlist, Session, Admin…)
│   ├── dto/             # Request/Response DTOs
│   ├── model/           # JPA entities (User, Playlist, StudySession…)
│   ├── repository/      # Spring Data JPA repositories
│   ├── service/         # Business logic services
│   └── web/             # Global exception handler
└── resources/
    ├── application.yml
    └── static/          # Frontend (HTML, CSS, JS)
        ├── index.html
        ├── css/
        ├── js/
        └── pages/
```

---

## 🔗 Links

- **GitHub**: [github.com/abdullahhimel46/cogneLearn](https://github.com/abdullahhimel46/cogneLearn)
- **Developer**: [Abdullah Himel](https://www.linkedin.com/in/its-abdullah-himel/)
- **Contact**: abdullahhimel46@gmail.com

---

© 2026 cogneLearn — Engineered for Deep Work.
