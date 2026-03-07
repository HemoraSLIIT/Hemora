# Local vs AWS — Which One Should You Do?
### Honest Plain English Analysis for Hemora

---

## What Your Friend Suggested

Your friend's idea is this:

1. Rent a small computer on AWS (called an EC2 instance)
2. Put your Django backend on it
3. Put your .pt model files on it
4. Access the whole thing from anywhere through the internet

This is a real and valid approach. But there is an important problem with
doing it on the **free tier** specifically — and this project will hit that
problem hard. Let me explain.

---

## The Free Tier Problem — RAM

AWS Free Tier gives you a machine called a **t2.micro**.

This machine has:
- 1 CPU
- **1 GB of RAM (memory)**

Now think about what your project needs to run at the same time:

| What is running | How much RAM it needs |
|---|---|
| Django backend | ~250 MB |
| PostgreSQL database | ~150 MB |
| Loading ONE YOLO model (.pt file) | ~500 MB to 1 GB |
| Loading TWO YOLO models (ALL + Thalassemia) | ~1 GB to 2 GB |
| **Total needed** | **~1.5 GB to 2.5 GB** |
| **What free tier gives you** | **1 GB** |

The machine will run out of memory the moment it tries to load your YOLO models.
It will either crash, freeze, or kill the process. This is not a code problem —
it is a hardware limit you cannot work around on the free tier.

---

## What You Would Need on AWS to Actually Make It Work

To run this project properly on AWS you would need at least a **t3.medium**,
which has 4 GB of RAM. That machine is NOT free. It costs around
**$30 to $35 per month**.

On top of that, you would also need to set up:

- **EC2** — the virtual machine that runs your Django server
- **RDS** — a managed PostgreSQL database (or install PostgreSQL on the same EC2)
- **S3** — a storage bucket to hold your .pt model files
- **Security Groups** — firewall rules so the internet can reach your server
- **Elastic IP** — a fixed IP address so your URL doesn't change every restart
- **SSH access** — to connect to the machine and set things up
- **Environment variables** — to configure your Django settings for production
- **Gunicorn + Nginx** — production-grade server setup (instead of Django's built-in dev server)

Each of these is a separate thing you need to learn, configure, and connect together.
For someone new to AWS, this realistically takes **1 to 3 days**, not a few hours.
And that is assuming nothing goes wrong.

---

## So What Is the Easy Option for a Few Hours?

**Run it locally and expose it to the internet using a tool called ngrok.**

Here is what ngrok does:

It creates a temporary public URL (like `https://abc123.ngrok.io`) that points
directly to your `localhost:8000`. Anyone on the internet — your teammates,
your supervisor, anyone — can hit that URL and reach your Django API running
on your own laptop. No servers, no AWS, no setup headaches.

How long it takes to set up: **10 minutes**.

---

## Local + ngrok vs AWS — Side by Side

| | Local + ngrok | AWS Free Tier | AWS Paid (t3.medium) |
|---|---|---|---|
| Setup difficulty | Very easy | Very hard | Hard |
| Time to set up | 10 minutes | 1–3 days | 1–2 days |
| Cost | Free | Free (but model won't run) | ~$30–35/month |
| ML models work | Yes, fully | No, not enough RAM | Yes, fully |
| URL changes | Yes, every restart | No, fixed | No, fixed |
| Always online | Only when your laptop is on | Yes, 24/7 | Yes, 24/7 |
| Good for | Development, demos, testing | Not suitable here | Production |

---

## How the Local + ngrok Setup Works

Your laptop runs everything. ngrok creates a tunnel from the internet to your laptop.

```
Someone on the internet
        │
        ▼
https://abc123.ngrok.io    ← temporary public URL (ngrok gives this)
        │
        ▼
Your laptop: localhost:8000  ← your Django API
        │
        ▼
YOLO models in data/models/  ← loaded from your local files
        │
        ▼
PostgreSQL database          ← running on your laptop via Docker
```

Everything stays exactly as it is. You just add ngrok on top.

---

## What About the Future — When You Actually Need It Always Online?

When you are ready to properly deploy (for a demo, submission, or real use),
the cleanest path for this project given that it has Docker already set up is:

**Option A — Railway or Render (easier than AWS)**
These are cloud platforms that work like AWS but are much simpler to use.
You connect your GitHub repo, click a few buttons, and it deploys.
They have free tiers too, but the same RAM problem applies for ML models.
You would need a paid plan for the ML to work.

**Option B — A single AWS EC2 t3.medium**
Rent one bigger machine, put everything on it (Django + PostgreSQL + model files),
use Docker Compose just like you do locally. Your docker-compose.yml is already
written — it would mostly work as-is with small changes to environment variables.
Cost is around $30/month.

**Option C — Separate the ML from the API**
Run the Django API on a small cheap server.
Only load the YOLO models when needed by spinning up a separate ML service.
This is the professional way but it is the most complex to set up.

For now, this is not something you need to worry about.

---

## The Honest Recommendation

**For the next few hours: use local + ngrok.**

You already have Docker Compose set up. Your backend runs with one command.
Add ngrok on top and you have a working public URL in minutes.

Do not spend hours fighting AWS free tier only to find the ML models crash the
machine because of the 1 GB RAM limit. That is a frustrating dead end.

When you are confident the app works completely and you need it always online,
then move to a proper paid setup. At that point it makes sense to invest the time.

---

## Quick Summary

- AWS free tier sounds appealing but the 1 GB RAM limit will crash your YOLO models
- Proper AWS setup takes days, not hours, for someone new to it
- Local + ngrok gives you a public URL in 10 minutes with zero cost
- When you genuinely need 24/7 hosting, use a t3.medium EC2 (~$30/month) with your existing docker-compose setup
