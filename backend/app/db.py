from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from backend.app.core.config import settings

class Base(DeclarativeBase):
    pass

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine)

def init_db():
    from backend.app.models import Brand, Post, PostMetrics, Recommendation  # noqa
    Base.metadata.create_all(engine)
    with engine.connect() as conn:
        try:
            # Check brands table
            result_brands = conn.execute(text("PRAGMA table_info(brands)"))
            existing_brand_cols = {row[1] for row in result_brands.fetchall()}
            new_brand_cols = {
                "business_description": "TEXT DEFAULT ''",
                "language": "VARCHAR(50) DEFAULT 'English'",
                "products_services": "TEXT DEFAULT ''",
                "location": "VARCHAR(100) DEFAULT ''",
                "competitors": "TEXT DEFAULT ''",
                "avoid_topics": "TEXT DEFAULT ''",
            }
            for col_name, col_type in new_brand_cols.items():
                if col_name not in existing_brand_cols:
                    conn.execute(text(f"ALTER TABLE brands ADD COLUMN {col_name} {col_type}"))
            
            # Check posts table
            result_posts = conn.execute(text("PRAGMA table_info(posts)"))
            existing_post_cols = {row[1] for row in result_posts.fetchall()}
            new_post_cols = {
                "published_at": "DATETIME",
                "topic": "VARCHAR(150) DEFAULT ''",
                "status": "VARCHAR(50) DEFAULT 'published'",
                "created_at": "DATETIME",
            }
            for col_name, col_type in new_post_cols.items():
                if col_name not in existing_post_cols:
                    conn.execute(text(f"ALTER TABLE posts ADD COLUMN {col_name} {col_type}"))
            
            conn.commit()
        except Exception:
            pass
