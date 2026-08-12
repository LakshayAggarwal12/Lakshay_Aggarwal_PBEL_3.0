"""
Database engine and session management.

Supports SQLite locally and PostgreSQL/Neon in production.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings


settings = get_settings()

db_url = settings.normalized_database_url


# SQLite requires this argument when used with FastAPI.
if db_url.startswith("sqlite"):
    connect_args = {
        "check_same_thread": False
    }
else:
    # Neon/PostgreSQL already gets SSL configuration from the
    # DATABASE_URL, e.g. ?sslmode=require
    connect_args = {}


engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    pass


def get_db():
    """
    FastAPI dependency.

    Creates a database session, yields it to the route,
    and guarantees that it is closed afterward.
    """
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()