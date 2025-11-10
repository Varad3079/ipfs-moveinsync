# Intelligent Floor Plan Management System (IFPMS) — Backend

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python\&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green?logo=fastapi\&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue?logo=postgresql\&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-6%2B-red?logo=redis\&logoColor=white) ![Celery](https://img.shields.io/badge/Celery-5.0%2B-green?logo=celery\&logoColor=white)

---

## 🚀 About This Project

The **Intelligent Floor Plan Management System (IFPMS)** backend powers a real‑time, secure, and highly scalable multi‑tenant workspace booking & floor plan management system.

It enables:

* Multi‑company tenant isolation
* Real‑time room booking & live admin updates
* Floorplan geometry‑based room management
* High‑performance caching & async tasks
* Conflict‑free collaborative admin workflows

---

## ✨ Key Features

* ✅ **Secure Multi‑Tenancy** (company‑isolated accessible resources)
* ⚡ **Real‑time WebSocket booking view**
* 🚀 **Redis‑powered caching** with smart invalidation
* 📨 **Celery + Redis async tasks** (email notifications, logs)
* 🧠 **Smart room recommendation engine**
* 🏢 **Multi‑floor support with geometric rooms**
* 🔐 **JWT Authentication with tenant metadata**
* 🔄 **Offline conflict‑resolution support**

---

## 🧠 Architecture Stack

| Layer           | Tech                    |
| --------------- | ----------------------- |
| Framework       | FastAPI                 |
| DB              | PostgreSQL + SQLAlchemy |
| Cache & Broker  | Redis                   |
| Background Jobs | Celery                  |
| Real‑Time       | WebSockets              |
| Auth            | JWT & OAuth2            |
| Models          | Pydantic                |

---

## 📁 Folder Structure

```bash
backend/
├── app.py                         # Main FastAPI entry
├── celery_config.py               # Celery worker config
├── tasks.py                       # Celery async tasks
├── constants.py                   # Environment/constants
├── requirements.txt
│
├── db/
│   ├── database.py                # SQLAlchemy engine
│   └── redis_conn.py              # Redis instance/cache utils
│
├── models/
│   ├── base.py                    # Base model
│   ├── company.py                 # Company (Tenant)
│   ├── user.py                    # User
│   ├── floorplan.py               # Floor & Rooms
│   └── booking.py                 # Booking + Preferences
│
├── routes/
│   ├── auth_routes.py             # Auth APIs
│   ├── admin_routes.py            # Admin APIs
│   ├── meeting_routes.py          # Room booking APIs
│   ├── live_routes.py             # WebSocket endpoint
│   └── sync_routes.py             # Offline sync
│
├── controllers/
│   ├── floorplan_service.py       # Business logic: floorplans
│   └── booking_service.py         # Business logic: bookings
│
└── utils/
    ├── security.py                # JWT + current user
    └── websocket_manager.py       # WebSocket + Redis pub/sub
```

---

## 🛠️ Local Setup

### ✅ Install prerequisites

```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip redis-server postgresql
```

### ✅ Create virtual environment

```bash
cd backend/
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### ✅ Setup PostgreSQL

```sql
CREATE USER myuser WITH PASSWORD 'mypassword';
CREATE DATABASE postgres OWNER myuser;
GRANT ALL PRIVILEGES ON DATABASE postgres TO myuser;
GRANT USAGE, CREATE ON SCHEMA public TO myuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO myuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO myuser;
```

### ✅ Environment Variables (`.env`)

```env
DB_USER="myuser"
DB_PASSWORD="mypassword"
DB_HOST="localhost"
DB_PORT=5432
DB_NAME="postgres"

REDIS_HOST="localhost"
REDIS_PORT=6379

SECRET_KEY="super_secret_key_change_me"
```

### ✅ Run Backend

#### FastAPI

```bash
uvicorn app:app --reload
```

#### Celery worker

```bash
celery -A celery_config.celery_app worker --loglevel=info
```

---

## 🔌 API Modules

* **/auth** → Register company, login
* **/admin** → Floorplans, room admin, view bookings
* **/meetings** → User booking, preferences, history
* **/ws** → WebSockets live feed
* **/sync** → Offline sync APIs

---

## 📦 Deployment Roadmap

* [ ] Dockerfile (FastAPI)
* [ ] Dockerfile (Celery)
* [ ] docker-compose (FastAPI + Redis + Postgres + Celery)
* [ ] Kubernetes YAML

---

## ✅ Status

Project active — multi‑tenant real‑time booking backend with Redis + Celery integrated.

---
