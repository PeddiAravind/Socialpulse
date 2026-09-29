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

    with SessionLocal() as session:
        if session.query(Brand).first() is not None:
            return

        brand = Brand(
            name="Hyderabad Brew House",
            industry="Café & Hospitality",
            business_description="Specialty artisanal coffee and bakery.",
            target_audience="Coffee connoisseurs and students",
            tone="Friendly & Conversational",
            language="English",
            location="Jubilee Hills, Hyderabad",
            products_services="Cold brews, Pour-over, Croissants",
            goals="Increase cafe visits and brand loyalty",
        )
        session.add(brand)
        session.flush()

        from backend.app.services import generate_synthetic_posts

        synthetic_items = generate_synthetic_posts(brand_id=brand.id, count=50)
        for item in synthetic_items:
            metrics = item["metrics"]
            post = Post(
                brand_id=brand.id,
                platform=item["platform"],
                published_at=item["published_at"],
                content_format=item["content_format"],
                category=item["category"],
                topic=item["topic"],
                caption=item["caption"],
                status=item["status"],
                created_at=item["created_at"],
                post_date=item["published_at"],
                reach=metrics["reach"],
                impressions=metrics["impressions"],
                likes=metrics["likes"],
                comments=metrics["comments"],
                shares=metrics["shares"],
                saves=metrics["saves"],
            )
            session.add(post)
            session.flush()
            session.add(PostMetrics(
                post_id=post.id,
                impressions=metrics["impressions"],
                reach=metrics["reach"],
                likes=metrics["likes"],
                comments=metrics["comments"],
                shares=metrics["shares"],
                saves=metrics["saves"],
                link_clicks=metrics["link_clicks"],
                follower_growth=metrics["follower_growth"],
                created_at=item["created_at"],
            ))

        session.commit()
