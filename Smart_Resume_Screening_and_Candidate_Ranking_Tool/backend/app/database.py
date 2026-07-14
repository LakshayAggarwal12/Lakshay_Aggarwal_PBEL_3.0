"""
Database engine + session management.

Uses SQLAlchemy 2.0 style. Swapping SQLite for Postgres later only requires
changing DATABASE_URL in .env — no code changes needed here.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

settings = get_settings()
db_url = settings.normalized_database_url

# check_same_thread is only needed for SQLite; harmless to gate it like this
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

# pool_pre_ping matters for hosted Postgres specifically: managed providers
# (Render free tier included) can silently drop idle connections, and
# without this the first query after a period of inactivity fails with a
# stale-connection error instead of transparently reconnecting.
engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yields a session and guarantees it's closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
