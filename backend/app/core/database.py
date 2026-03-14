"""PostgreSQL (NeonDB) connection pool using psycopg2."""
from __future__ import annotations

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from app.core.config import settings

_pool: pool.ThreadedConnectionPool | None = None


def init_db() -> None:
    """Create the connection pool (call once at startup)."""
    global _pool
    if _pool is None:
        _pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=settings.DATABASE_URL,
        )


def close_db() -> None:
    """Close the connection pool (call at shutdown)."""
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None


@contextmanager
def get_db():
    """Yield a database connection with RealDictCursor from the pool."""
    if _pool is None:
        init_db()
    conn = _pool.getconn()
    try:
        conn.autocommit = False
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


def execute_query(query: str, params: tuple = None, fetch: bool = True):
    """Execute a query and optionally return results as list of dicts."""
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if fetch:
                results = cur.fetchall()
            else:
                results = None
            conn.commit()
            return results


def execute_one(query: str, params: tuple = None):
    """Execute a query and return a single row as dict."""
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            result = cur.fetchone()
            conn.commit()
            return result
