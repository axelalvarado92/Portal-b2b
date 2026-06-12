# shared/db.py

import psycopg2
import os

_conn = None


def get_connection():
    global _conn

    try:
        if _conn is None or _conn.closed:
            _conn = psycopg2.connect(
                os.environ["DATABASE_URL"]
            )

        else:
            # Verifica que la conexión siga viva
            with _conn.cursor() as cur:
                cur.execute("SELECT 1")

        return _conn

    except Exception:
        # Si la conexión quedó corrupta/reutilizada mal
        _conn = psycopg2.connect(
            os.environ["DATABASE_URL"]
        )

        return _conn