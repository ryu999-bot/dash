"""Database connection factory for bar_shop1 and barunson."""
import pymssql
from config import DB_CONFIG


def get_bar_shop1():
    """Return a pymssql connection to bar_shop1."""
    return pymssql.connect(**DB_CONFIG, database="bar_shop1")


def get_barunson():
    """Return a pymssql connection to barunson."""
    return pymssql.connect(**DB_CONFIG, database="barunson")


def query(db_name, sql, params=None):
    """Execute SQL and return list of dicts. db_name: 'bar_shop1' or 'barunson'."""
    conn_fn = get_bar_shop1 if db_name == "bar_shop1" else get_barunson
    conn = conn_fn()
    try:
        cur = conn.cursor(as_dict=True)
        cur.execute(sql, params or ())
        if cur.description:
            return cur.fetchall()
        return []
    finally:
        conn.close()
