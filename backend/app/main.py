import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.db import SessionLocal, init_db
from backend.app.models import Brand, Post, PostMetrics, Recommendation
from backend.app.services import (
    insights,
    memory,
    analyze_brand_posts,
    calculate_post_engagement_rate,
    generate_synthetic_posts,
    generate_recommendations,
)

app = FastAPI(title="SocialPulse AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup(): init_db()

def db():
    s = SessionLocal()
    try:
        yield s
    finally:
        s.close()

class BrandIn(BaseModel):
    name: str
    industry: str = "Café"
    business_description: str = ""
    target_audience: str = ""
    tone: str = "Friendly"
    language: str = "English"
    products_services: str = ""
    location: str = ""
    goals: str = ""
    competitors: str = ""
    avoid_topics: str = ""

class PostMetricsIn(BaseModel):
    impressions: int = 0
    reach: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    link_clicks: int = 0
    follower_growth: int = 0

class PostIn(BaseModel):
    platform: str = "Instagram"
    published_at: Optional[datetime] = None
    content_format: str = "Reel"
    category: str = "Educational"
    topic: str = ""
    caption: str = ""
    status: str = "published"
    impressions: Optional[int] = None
    reach: Optional[int] = None
    likes: Optional[int] = None
    comments: Optional[int] = None
    shares: Optional[int] = None
    saves: Optional[int] = None
    link_clicks: Optional[int] = None
    follower_growth: Optional[int] = None
    metrics: Optional[PostMetricsIn] = None

class Question(BaseModel):
    question: str = "What should I post tomorrow?"

class Feedback(BaseModel):
    feedback: str

class ExperimentObservation(BaseModel):
    observation: str
    context: str = "Memory Lab experiment"

class RecommendationRequest(BaseModel):
    query: str = "What should I post tomorrow?"
    baseline: bool = False

class RecommendationActionRequest(BaseModel):
    action: str = "approve"  # approve, reject, edit
    recommendation_index: Optional[int] = 0
    edited_content: Optional[Dict[str, Any]] = None
    feedback: Optional[str] = None

def post_to_dict(p: Post) -> Dict[str, Any]:
    if p.metrics:
        imp = p.metrics.impressions or 0
        r = p.metrics.reach or 0
        l = p.metrics.likes or 0
        c = p.metrics.comments or 0
        sh = p.metrics.shares or 0
        sa = p.metrics.saves or 0
        lc = p.metrics.link_clicks or 0
        fg = p.metrics.follower_growth or 0
    else:
        imp = p.impressions or 0
        r = p.reach or 0
        l = p.likes or 0
        c = p.comments or 0
        sh = p.shares or 0
        sa = p.saves or 0
        lc = 0
        fg = 0
        
    eng_rate = calculate_post_engagement_rate(reach=r, likes=l, comments=c, shares=sh, saves=sa)
    pub = p.published_at or p.post_date or p.created_at
    
    return {
        "id": p.id,
        "brand_id": p.brand_id,
        "platform": p.platform,
        "published_at": pub.isoformat() if pub else None,
        "content_format": p.content_format,
        "category": p.category,
        "topic": p.topic or "",
        "caption": p.caption or "",
        "status": p.status or "published",
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "reach": r,
        "impressions": imp,
        "likes": l,
        "comments": c,
        "shares": sh,
        "saves": sa,
        "metrics": {
            "impressions": imp,
            "reach": r,
            "likes": l,
            "comments": c,
            "shares": sh,
            "saves": sa,
            "link_clicks": lc,
            "follower_growth": fg,
            "engagement_rate": eng_rate,
        }
    }

@app.get("/api/health")
def health():
    return {"status": "ok", "memory_backend": memory.backend_name}

@app.post("/api/brands")
def create_brand(x: BrandIn, s: Session = Depends(db)):
    if not x.name or not x.name.strip():
        raise HTTPException(status_code=400, detail="Brand Name is required.")
    if not x.industry or not x.industry.strip():
        raise HTTPException(status_code=400, detail="Industry is required.")
    
    b = Brand(**x.model_dump())
    s.add(b)
    s.commit()
    s.refresh(b)
    
    mem_details = (
        f"Brand profile:\n"
        f"{b.name} is a {b.industry} business.\n"
        f"Description: {b.business_description or 'N/A'}.\n"
        f"Target audience: {b.target_audience or 'N/A'}.\n"
        f"Tone: {b.tone or 'N/A'}.\n"
        f"Language: {b.language or 'English'}.\n"
        f"Location: {b.location or 'N/A'}.\n"
        f"Products/Services: {b.products_services or 'N/A'}.\n"
        f"Goal: {b.goals or 'N/A'}.\n"
        f"Competitors: {b.competitors or 'N/A'}.\n"
        f"Avoid topics: {b.avoid_topics or 'N/A'}."
    )
    
    memory.retain(b.id, mem_details, "Brand profile onboarding", brand_name=b.name)
    
    return {
        "id": b.id,
        "name": b.name,
        "industry": b.industry,
        "business_description": b.business_description,
        "target_audience": b.target_audience,
        "tone": b.tone,
        "language": b.language,
        "products_services": b.products_services,
        "location": b.location,
        "goals": b.goals,
        "competitors": b.competitors,
        "avoid_topics": b.avoid_topics,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }

@app.get("/api/brands")
def brands(s: Session = Depends(db)):
    all_b = s.query(Brand).all()
    return [
        {
            "id": b.id,
            "name": b.name,
            "industry": b.industry,
            "business_description": b.business_description,
            "target_audience": b.target_audience,
            "tone": b.tone,
            "language": b.language,
            "products_services": b.products_services,
            "location": b.location,
            "goals": b.goals,
            "competitors": b.competitors,
            "avoid_topics": b.avoid_topics,
        }
        for b in all_b
    ]

@app.get("/api/brands/{brand_id}")
def get_brand(brand_id: int, s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    if not b:
        raise HTTPException(404, "Brand not found")
    return {
        "id": b.id,
        "name": b.name,
        "industry": b.industry,
        "business_description": b.business_description,
        "target_audience": b.target_audience,
        "tone": b.tone,
        "language": b.language,
        "products_services": b.products_services,
        "location": b.location,
        "goals": b.goals,
        "competitors": b.competitors,
        "avoid_topics": b.avoid_topics,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }

@app.post("/api/brands/{brand_id}/posts")
def create_post(brand_id: int, x: PostIn, s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    if not b:
        raise HTTPException(404, "Brand not found")
        
    pub_at = x.published_at or datetime.utcnow()
    m_data = x.metrics.model_dump() if x.metrics else {}
    impressions = x.impressions if x.impressions is not None else m_data.get("impressions", 0)
    reach = x.reach if x.reach is not None else m_data.get("reach", 0)
    likes = x.likes if x.likes is not None else m_data.get("likes", 0)
    comments = x.comments if x.comments is not None else m_data.get("comments", 0)
    shares = x.shares if x.shares is not None else m_data.get("shares", 0)
    saves = x.saves if x.saves is not None else m_data.get("saves", 0)
    link_clicks = x.link_clicks if x.link_clicks is not None else m_data.get("link_clicks", 0)
    follower_growth = x.follower_growth if x.follower_growth is not None else m_data.get("follower_growth", 0)

    p = Post(
        brand_id=brand_id,
        platform=x.platform,
        published_at=pub_at,
        post_date=pub_at,
        content_format=x.content_format,
        category=x.category,
        topic=x.topic,
        caption=x.caption,
        status=x.status,
        created_at=datetime.utcnow(),
        reach=reach,
        impressions=impressions,
        likes=likes,
        comments=comments,
        shares=shares,
        saves=saves,
    )
    s.add(p)
    s.flush()
    
    pm = PostMetrics(
        post_id=p.id,
        impressions=impressions,
        reach=reach,
        likes=likes,
        comments=comments,
        shares=shares,
        saves=saves,
        link_clicks=link_clicks,
        follower_growth=follower_growth,
        created_at=datetime.utcnow(),
    )
    s.add(pm)
    s.commit()
    s.refresh(p)
    
    return post_to_dict(p)

@app.get("/api/brands/{brand_id}/posts")
def get_brand_posts(brand_id: int, s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    if not b:
        raise HTTPException(404, "Brand not found")
    posts = s.query(Post).filter(Post.brand_id == brand_id).order_by(Post.published_at.desc(), Post.id.desc()).all()
    return [post_to_dict(p) for p in posts]

@app.post("/api/brands/{brand_id}/seed")
def seed(brand_id: int, s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    if not b:
        raise HTTPException(404, "Brand not found")
        
    synthetic_items = generate_synthetic_posts(brand_id=brand_id, count=50)
    for item in synthetic_items:
        p = Post(
            brand_id=brand_id,
            platform=item["platform"],
            published_at=item["published_at"],
            content_format=item["content_format"],
            category=item["category"],
            topic=item["topic"],
            caption=item["caption"],
            status=item["status"],
            created_at=item["created_at"],
            post_date=item["published_at"],
            reach=item["metrics"]["reach"],
            impressions=item["metrics"]["impressions"],
            likes=item["metrics"]["likes"],
            comments=item["metrics"]["comments"],
            shares=item["metrics"]["shares"],
            saves=item["metrics"]["saves"],
        )
        s.add(p)
        s.flush()
        
        pm = PostMetrics(
            post_id=p.id,
            impressions=item["metrics"]["impressions"],
            reach=item["metrics"]["reach"],
            likes=item["metrics"]["likes"],
            comments=item["metrics"]["comments"],
            shares=item["metrics"]["shares"],
            saves=item["metrics"]["saves"],
            link_clicks=item["metrics"]["link_clicks"],
            follower_growth=item["metrics"]["follower_growth"],
            created_at=item["created_at"],
        )
        s.add(pm)
        
    s.commit()
    return {
        "seeded": len(synthetic_items),
        "brand_id": brand_id,
        "brand_name": b.name,
        "notice": "Synthetic historical demo data (50 posts generated across Instagram, Facebook, LinkedIn with realistic metric distributions)."
    }

@app.get("/api/brands/{brand_id}/analytics")
def get_brand_analytics(brand_id: int, s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    if not b:
        raise HTTPException(404, "Brand not found")
    posts = s.query(Post).filter(Post.brand_id == brand_id).all()
    post_dicts = [post_to_dict(p) for p in posts]
    analytics = analyze_brand_posts(post_dicts)
    analytics["brand_id"] = brand_id
    analytics["brand_name"] = b.name
    return analytics

@app.post("/api/brands/{brand_id}/learn")
def learn(brand_id: int, s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    if not b:
        raise HTTPException(404, "Brand not found")
    posts = s.query(Post).filter(Post.brand_id == brand_id).all()
    if not posts:
        raise HTTPException(400, "No historical posts found to analyze. Please seed or create posts first.")
    
    post_dicts = [post_to_dict(p) for p in posts]
    analytics = analyze_brand_posts(post_dicts)
    
    sample_size = analytics["total_posts"]
    date_range = analytics["date_range"]
    best_fmt = analytics.get("best_format")
    best_cat = analytics.get("best_category")
    avg_eng = analytics.get("average_engagement_rate", 0.0)
    
    observations = []
    if best_fmt:
        obs_text = (
            f"Observed highest average engagement rate with format '{best_fmt['name']}' "
            f"({best_fmt['avg_engagement_rate']}% vs overall average {avg_eng}% across {sample_size} historical posts from {date_range})."
        )
        observations.append(obs_text)
        
    if best_cat:
        cat_text = (
            f"Category '{best_cat['name']}' achieved the highest observed average engagement rate ({best_cat['avg_engagement_rate']}%) "
            f"in the dataset."
        )
        observations.append(cat_text)
        
    for obs in observations:
        obs_text = (
            f"Historical observation:\n"
            f"Across {sample_size} analyzed posts from {date_range}, {obs}\n"
            f"This is an observed historical correlation and does not prove causation."
        )
        memory.retain(
            brand_id,
            obs_text,
            "Performance learning",
            brand_name=b.name
        )
        
    return {
        "status": "success",
        "brand_id": brand_id,
        "sample_size": sample_size,
        "date_range": date_range,
        "observations": observations,
        "analytics": analytics,
        "insights": observations + [analytics["caveat"]],
        "averages": {k: v["avg_engagement_rate"] for k, v in analytics["by_content_format"].items()}
    }

@app.post("/api/brands/{brand_id}/recommendations")
def create_recommendations(brand_id: int, req: RecommendationRequest = RecommendationRequest(), s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    if not b:
        raise HTTPException(404, "Brand not found")
        
    if req.baseline:
        analytics = {}
        memories_list = []
        prev_recs_dicts = []
    else:
        posts = s.query(Post).filter(Post.brand_id == brand_id).all()
        post_dicts = [post_to_dict(p) for p in posts]
        analytics = analyze_brand_posts(post_dicts)

        # Core Hindsight recall query as per Milestone specification
        memories_list = memory.recall(brand_id, query=req.query, brand_name=b.name)
        if not memories_list:
            memories_list = memory.list(brand_id)

        prev_recs = s.query(Recommendation).filter(Recommendation.brand_id == brand_id).order_by(Recommendation.generated_at.desc()).limit(5).all()
        prev_recs_dicts = [
            {
                "id": r.id,
                "query": r.query,
                "recommendations": r.recommendations,
                "status": r.status,
                "selected_recommendation": r.selected_recommendation,
            }
            for r in prev_recs
        ]
    
    brand_dict = {
        "id": b.id,
        "name": b.name,
        "industry": b.industry,
        "business_description": b.business_description,
        "target_audience": b.target_audience,
        "tone": b.tone,
        "language": b.language,
        "products_services": b.products_services,
        "location": b.location,
        "goals": b.goals,
        "competitors": b.competitors,
        "avoid_topics": b.avoid_topics,
    }
    
    result = generate_recommendations(
        brand=brand_dict,
        analytics=analytics,
        memories=memories_list,
        previous_recommendations=prev_recs_dicts,
        query=req.query,
    )
    
    if not req.baseline:
        # Keep the isolated baseline out of history used by normal recommendations.
        rec_record = Recommendation(
            brand_id=brand_id,
            query=req.query,
            generated_at=datetime.utcnow(),
            recommendations=json.dumps(result["recommendations"]),
            status="generated",
            created_at=datetime.utcnow(),
        )
        s.add(rec_record)
        s.commit()
        s.refresh(rec_record)
        result["recommendation_id"] = rec_record.id
    result["brand_id"] = brand_id
    result["brand_name"] = b.name
    result["memory_backend"] = memory.backend_name
    return result

@app.get("/api/brands/{brand_id}/recommendations")
def get_recommendations_history(brand_id: int, s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    if not b:
        raise HTTPException(404, "Brand not found")
        
    records = s.query(Recommendation).filter(Recommendation.brand_id == brand_id).order_by(Recommendation.generated_at.desc()).all()
    res = []
    for r in records:
        try:
            parsed_recs = json.loads(r.recommendations) if r.recommendations else []
        except Exception:
            parsed_recs = []
        res.append({
            "id": r.id,
            "brand_id": r.brand_id,
            "query": r.query,
            "generated_at": r.generated_at.isoformat() if r.generated_at else None,
            "status": r.status,
            "selected_recommendation": r.selected_recommendation,
            "user_feedback": r.user_feedback,
            "recommendations": parsed_recs,
        })
    return res

@app.post("/api/brands/{brand_id}/recommendations/{rec_id}/action")
def update_recommendation_action(brand_id: int, rec_id: int, act: RecommendationActionRequest, s: Session = Depends(db)):
    r = s.get(Recommendation, rec_id)
    if not r or r.brand_id != brand_id:
        raise HTTPException(404, "Recommendation not found")
        
    b = s.get(Brand, brand_id)
    brand_name = b.name if b else None

    r.status = act.action
    r.selected_recommendation = act.recommendation_index
    if act.feedback:
        r.user_feedback = act.feedback
        # Store feedback in memory if rejected or explicit preference
        memory.retain(brand_id, f"Owner preference:\n{act.feedback}", "Owner feedback", brand_name=brand_name)
    elif act.action in ["approved", "rejected"]:
        curr_recs = []
        try:
            curr_recs = json.loads(r.recommendations) if r.recommendations else []
        except Exception:
            pass
        idx = act.recommendation_index or 0
        rec_item = curr_recs[idx] if 0 <= idx < len(curr_recs) else {}
        fmt = rec_item.get("format", "content")
        title = rec_item.get("title", "")
        cat = rec_item.get("category", "")
        if act.action == "approved":
            outcome_text = f"Recommendation outcome:\nOwner approved a {fmt} ({cat}) about '{title}'."
        else:
            outcome_text = f"Recommendation outcome:\nOwner rejected a {fmt} ({cat}) about '{title}'."
        memory.retain(brand_id, outcome_text, "Recommendation outcome", brand_name=brand_name)
        
    if act.action == "edit" and act.edited_content:
        try:
            curr_recs = json.loads(r.recommendations)
            if 0 <= (act.recommendation_index or 0) < len(curr_recs):
                curr_recs[act.recommendation_index or 0].update(act.edited_content)
                r.recommendations = json.dumps(curr_recs)
        except Exception:
            pass
            
    s.commit()
    s.refresh(r)
    return {
        "status": "success",
        "action": r.status,
        "recommendation_id": r.id,
        "feedback_saved": bool(act.feedback),
    }

@app.post("/api/brands/{brand_id}/recommend")
def recommend(brand_id: int, x: Question, s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    if not b: raise HTTPException(404, "Brand not found")
    
    # Bridge to new recommendation engine
    rec_out = create_recommendations(brand_id=brand_id, req=RecommendationRequest(query=x.question), s=s)
    top_rec = rec_out["recommendations"][0] if rec_out.get("recommendations") else {}
    
    return {
        "topic": top_rec.get("title", "A behind-the-scenes story around a product or service"),
        "format": top_rec.get("format", "Reel"),
        "category": top_rec.get("category", "Behind-the-scenes"),
        "content_idea": top_rec.get("content_idea", ""),
        "reason": top_rec.get("reason", "Recommendation uses available evidence and persistent memory."),
        "evidence": [top_rec.get("evidence_used")] if top_rec.get("evidence_used") else [],
        "memories": rec_out.get("memories_used", []),
        "stage": rec_out.get("stage", "cold-start"),
        "what_changed": rec_out.get("what_changed", ""),
        "recommendations": rec_out.get("recommendations", []),
        "memory_backend": memory.backend_name,
    }

@app.post("/api/brands/{brand_id}/feedback")
def feedback(brand_id: int, x: Feedback, s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    brand_name = b.name if b else None
    backend = memory.retain(brand_id, f"Owner preference:\n{x.feedback}", "Owner feedback", brand_name=brand_name)
    return {"stored": True, "feedback": x.feedback, "backend": backend}

@app.post("/api/brands/{brand_id}/memory/experiment")
def record_experiment_observation(brand_id: int, x: ExperimentObservation, s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    if not b:
        raise HTTPException(404, "Brand not found")
    backend = memory.retain(
        brand_id,
        x.observation,
        context=x.context,
        brand_name=b.name,
    )
    return {
        "stored": True,
        "observation": x.observation,
        "context": x.context,
        "backend": backend,
    }

@app.get("/api/brands/{brand_id}/memory")
def memories(brand_id: int):
    return {"backend": memory.backend_name, "items": memory.list(brand_id)}

@app.get("/api/brands/{brand_id}/memory/status")
def memory_status(brand_id: int, s: Session = Depends(db)):
    b = s.get(Brand, brand_id)
    if not b:
        raise HTTPException(404, "Brand not found")
    return memory.get_status(brand_id)
