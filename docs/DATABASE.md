# Database

## Connection string parameters

The credential itself lives in `.env.local` and in Vercel. What is *not* duplicated anywhere
else is production's pool tuning, so it is written down here rather than only in a file that
gets deleted:

```
DATABASE_URL=…?pgbouncer=true&sslmode=require&statement_cache_size=0&connection_limit=10&pool_timeout=20
```

`DATABASE_URL` uses the transaction-mode pooler on port **6543**; `DIRECT_URL`, which only
migrations use, is the session-mode pooler on **5432** and carries `sslmode=require` alone.

`boardly-dev` (`inmvbxfflqeblynpktay`, eu-central-2) sits on the **`aws-0`** pooler, production
(`vamydthjlytrseqdpzqv`) on **`aws-1`** — they are not interchangeable, and assuming they were
cost an afternoon on 2026-09-07.

## Vercel variable types (settled 2026-09-07)

| Variable | Production / Preview | Why |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Config, readable | Inlined into the client bundle; hiding it from yourself buys nothing |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Config, readable | Same |
| `DATABASE_URL` | **Secret**, write-only | Full database access |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret**, write-only | Bypasses RLS entirely |

Secret means Vercel never returns the value again — not in the dashboard, not in
`vercel env pull`. Keep your own copy; `.env.local` is it. Development cannot be made
sensitive: Vercel rejects it server-side.

`vercel env add` defaults to **sensitive on Production and Preview**. Pass `--no-sensitive`
when the value is meant to stay readable.
