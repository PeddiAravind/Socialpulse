from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db import Base

class Brand(Base):
    __tablename__ = "brands"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    industry: Mapped[str] = mapped_column(String(100), default="Café")
    business_description: Mapped[str] = mapped_column(Text, default="")
    target_audience: Mapped[str] = mapped_column(Text, default="")
    tone: Mapped[str] = mapped_column(String(100), default="Friendly")
    language: Mapped[str] = mapped_column(String(50), default="English")
    products_services: Mapped[str] = mapped_column(Text, default="")
    location: Mapped[str] = mapped_column(String(100), default="")
    goals: Mapped[str] = mapped_column(Text, default="")
    competitors: Mapped[str] = mapped_column(Text, default="")
    avoid_topics: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    posts: Mapped[List["Post"]] = relationship("Post", back_populates="brand", cascade="all, delete-orphan")
    recommendations: Mapped[List["Recommendation"]] = relationship("Recommendation", back_populates="brand", cascade="all, delete-orphan")

class Recommendation(Base):
    __tablename__ = "recommendations"
    id: Mapped[int] = mapped_column(primary_key=True)
    brand_id: Mapped[int] = mapped_column(ForeignKey("brands.id"))
    query: Mapped[str] = mapped_column(Text, default="What should I post tomorrow?")
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    recommendations: Mapped[str] = mapped_column(Text, default="[]")  # JSON encoded list of 3 recommendations
    selected_recommendation: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="generated")  # generated, approved, rejected, edited
    user_feedback: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    brand: Mapped["Brand"] = relationship("Brand", back_populates="recommendations")

class Post(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(primary_key=True)
    brand_id: Mapped[int] = mapped_column(ForeignKey("brands.id"))
    platform: Mapped[str] = mapped_column(String(40), default="Instagram")
    published_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    content_format: Mapped[str] = mapped_column(String(60), default="Reel")
    category: Mapped[str] = mapped_column(String(80), default="Educational")
    topic: Mapped[str] = mapped_column(String(150), default="")
    caption: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(50), default="published")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Legacy fields preserved for backward compatibility
    post_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    reach: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    impressions: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    likes: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    comments: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    shares: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    saves: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)

    brand: Mapped["Brand"] = relationship("Brand", back_populates="posts")
    metrics: Mapped[Optional["PostMetrics"]] = relationship("PostMetrics", back_populates="post", uselist=False, cascade="all, delete-orphan")

class PostMetrics(Base):
    __tablename__ = "post_metrics"
    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"))
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    reach: Mapped[int] = mapped_column(Integer, default=0)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[int] = mapped_column(Integer, default=0)
    shares: Mapped[int] = mapped_column(Integer, default=0)
    saves: Mapped[int] = mapped_column(Integer, default=0)
    link_clicks: Mapped[int] = mapped_column(Integer, default=0)
    follower_growth: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    post: Mapped["Post"] = relationship("Post", back_populates="metrics")
