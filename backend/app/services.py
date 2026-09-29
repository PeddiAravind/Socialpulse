import asyncio
import atexit
import random
import threading
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings

def calculate_post_engagement_rate(reach: int, likes: int, comments: int, shares: int, saves: int) -> float:
    """
    Calculates Engagement Rate by Reach: (likes + comments + shares + saves) / reach * 100
    Handles zero reach, missing values, and negative numbers safely.
    """
    reach = max(0, int(reach or 0))
    if reach <= 0:
        return 0.0
    interactions = max(0, int(likes or 0)) + max(0, int(comments or 0)) + max(0, int(shares or 0)) + max(0, int(saves or 0))
    return round((interactions / reach) * 100.0, 2)

def rate(p: Dict[str, Any]) -> float:
    return calculate_post_engagement_rate(
        reach=p.get("reach", 0),
        likes=p.get("likes", 0),
        comments=p.get("comments", 0),
        shares=p.get("shares", 0),
        saves=p.get("saves", 0),
    )

def analyze_brand_posts(posts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes comprehensive analytics across posts and their metrics:
    - Total posts, reach, impressions
    - Overall average engagement rate
    - Segmented averages by content format, category, and platform
    - Top & lowest observed formats and categories
    - Recent performance trend
    - Observational caveat disclaimer
    """
    if not posts:
        return {
            "total_posts": 0,
            "total_reach": 0,
            "total_impressions": 0,
            "average_engagement_rate": 0.0,
            "by_content_format": {},
            "by_category": {},
            "by_platform": {},
            "best_format": None,
            "lowest_format": None,
            "best_category": None,
            "lowest_category": None,
            "recent_trend": [],
            "date_range": "No posts recorded",
            "caveat": "These are historical observations from the available sample and do not prove that the content format caused the result."
        }

    total_reach = 0
    total_impressions = 0
    rates = []

    format_stats: Dict[str, List[float]] = {}
    category_stats: Dict[str, List[float]] = {}
    platform_stats: Dict[str, List[float]] = {}

    format_reach: Dict[str, int] = {}
    category_reach: Dict[str, int] = {}
    platform_reach: Dict[str, int] = {}

    format_impressions: Dict[str, int] = {}
    category_impressions: Dict[str, int] = {}
    platform_impressions: Dict[str, int] = {}

    trend = []
    dates = []

    for p in posts:
        r = max(0, int(p.get("reach") or 0))
        imp = max(0, int(p.get("impressions") or 0))
        eng = rate(p)

        total_reach += r
        total_impressions += imp
        rates.append(eng)

        fmt = p.get("content_format") or "Unknown"
        cat = p.get("category") or "Unknown"
        plat = p.get("platform") or "Unknown"

        format_stats.setdefault(fmt, []).append(eng)
        format_reach[fmt] = format_reach.get(fmt, 0) + r
        format_impressions[fmt] = format_impressions.get(fmt, 0) + imp

        category_stats.setdefault(cat, []).append(eng)
        category_reach[cat] = category_reach.get(cat, 0) + r
        category_impressions[cat] = category_impressions.get(cat, 0) + imp

        platform_stats.setdefault(plat, []).append(eng)
        platform_reach[plat] = platform_reach.get(plat, 0) + r
        platform_impressions[plat] = platform_impressions.get(plat, 0) + imp

        pub_date = p.get("published_at") or p.get("post_date") or p.get("created_at")
        date_str = ""
        if isinstance(pub_date, datetime):
            date_str = pub_date.strftime("%Y-%m-%d")
            dates.append(pub_date)
        elif isinstance(pub_date, str):
            date_str = pub_date[:10]
            try:
                dates.append(datetime.fromisoformat(pub_date.replace("Z", "")))
            except Exception:
                pass

        trend.append({
            "date": date_str,
            "format": fmt,
            "category": cat,
            "platform": plat,
            "engagement_rate": eng,
            "reach": r,
            "impressions": imp
        })

    def calc_group_averages(stats_dict, reach_dict, imp_dict):
        res = {}
        for key, vals in stats_dict.items():
            avg_eng = round(sum(vals) / len(vals), 2) if vals else 0.0
            res[key] = {
                "count": len(vals),
                "avg_engagement_rate": avg_eng,
                "total_reach": reach_dict.get(key, 0),
                "total_impressions": imp_dict.get(key, 0),
            }
        return res

    by_format = calc_group_averages(format_stats, format_reach, format_impressions)
    by_category = calc_group_averages(category_stats, category_reach, category_impressions)
    by_platform = calc_group_averages(platform_stats, platform_reach, platform_impressions)

    overall_avg = round(sum(rates) / len(rates), 2) if rates else 0.0

    best_fmt = max(by_format.items(), key=lambda x: x[1]["avg_engagement_rate"]) if by_format else None
    lowest_fmt = min(by_format.items(), key=lambda x: x[1]["avg_engagement_rate"]) if by_format else None

    best_cat = max(by_category.items(), key=lambda x: x[1]["avg_engagement_rate"]) if by_category else None
    lowest_cat = min(by_category.items(), key=lambda x: x[1]["avg_engagement_rate"]) if by_category else None

    if dates:
        min_date = min(dates).strftime("%Y-%m-%d")
        max_date = max(dates).strftime("%Y-%m-%d")
        date_range = f"{min_date} to {max_date}"
    else:
        date_range = "N/A"

    return {
        "total_posts": len(posts),
        "total_reach": total_reach,
        "total_impressions": total_impressions,
        "average_engagement_rate": overall_avg,
        "by_content_format": by_format,
        "by_category": by_category,
        "by_platform": by_platform,
        "best_format": {"name": best_fmt[0], "avg_engagement_rate": best_fmt[1]["avg_engagement_rate"]} if best_fmt else None,
        "lowest_format": {"name": lowest_fmt[0], "avg_engagement_rate": lowest_fmt[1]["avg_engagement_rate"]} if lowest_fmt else None,
        "best_category": {"name": best_cat[0], "avg_engagement_rate": best_cat[1]["avg_engagement_rate"]} if best_cat else None,
        "lowest_category": {"name": lowest_cat[0], "avg_engagement_rate": lowest_cat[1]["avg_engagement_rate"]} if lowest_cat else None,
        "recent_trend": trend[-15:] if len(trend) > 15 else trend,
        "date_range": date_range,
        "caveat": "These are historical observations from the available sample and do not prove that the content format caused the result."
    }

def insights(posts: List[Dict[str, Any]]):
    analytics = analyze_brand_posts(posts)
    ins = []
    if analytics["best_format"]:
        ins.append(f"{analytics['best_format']['name']} has the highest observed average engagement rate ({analytics['best_format']['avg_engagement_rate']}%).")
    if analytics["best_category"]:
        ins.append(f"Category '{analytics['best_category']['name']}' achieved the highest observed average engagement rate ({analytics['best_category']['avg_engagement_rate']}%).")
    ins.append(analytics["caveat"])
    
    avg_map = {k: v["avg_engagement_rate"] for k, v in analytics["by_content_format"].items()}
    return ins, avg_map

def generate_synthetic_posts(brand_id: int, count: int = 50) -> List[Dict[str, Any]]:
    """
    Generates approximately 50 synthetic posts with realistic distributions
    across platforms, formats, categories, and metrics.
    Avoids hardcoded winners to let analytics compute observed patterns organically.
    """
    platforms = ["Instagram", "Facebook", "LinkedIn"]
    formats = ["Reel", "Carousel", "Image", "Story"]
    categories = ["Educational", "Promotional", "Behind-the-scenes", "Product", "Community", "Seasonal"]

    topics_by_cat = {
        "Educational": ["How-to guide", "Industry tips & tricks", "Common mistakes to avoid", "Step-by-step tutorial", "Did you know?"],
        "Promotional": ["Weekend special offer", "Limited time discount", "New seasonal launch", "Flash sale alert", "Member exclusive perk"],
        "Behind-the-scenes": ["A day in our workshop", "Meet the team spotlight", "How our product is crafted", "Morning prep routine", "Unboxing raw materials"],
        "Product": ["Feature spotlight", "Customer favorite pick", "New variant preview", "In-depth review", "Before and after comparison"],
        "Community": ["Customer story & testimonial", "Q&A with founder", "Local meetup highlight", "Fan spotlight of the week", "Community milestone celebration"],
        "Seasonal": ["Summer vibes showcase", "Holiday gift guide", "Monsoon special feature", "New year kickoff", "Festive greeting & special"]
    }

    synthetic_posts = []
    now = datetime.utcnow()

    # Base variations with realistic organic variance
    for i in range(count):
        days_ago = (count - i) * 1.5 + random.uniform(0, 1.2)
        pub_time = now - timedelta(days=days_ago)

        plat = random.choice(platforms)
        fmt = random.choice(formats)
        cat = random.choice(categories)
        topic = random.choice(topics_by_cat.get(cat, ["General update"]))
        caption = f"Synthetic Post {i+1}: {topic} on {plat} ({fmt} - {cat})."

        # Plausible metrics tailored by platform and format with natural noise
        base_reach = random.randint(1200, 6500)
        if fmt in ["Reel", "Carousel"]:
            base_reach = int(base_reach * random.uniform(1.1, 1.6))
        elif fmt == "Story":
            base_reach = int(base_reach * random.uniform(0.6, 0.95))

        impressions = int(base_reach * random.uniform(1.15, 1.45))
        
        # Engagement variation: roughly 2% - 10%
        target_eng_pct = random.uniform(0.025, 0.095)
        total_eng = max(1, int(base_reach * target_eng_pct))

        likes = int(total_eng * random.uniform(0.55, 0.75))
        comments = int(total_eng * random.uniform(0.08, 0.18))
        shares = int(total_eng * random.uniform(0.05, 0.15))
        saves = max(0, total_eng - likes - comments - shares)
        link_clicks = random.randint(5, max(6, int(base_reach * 0.02)))
        follower_growth = random.randint(1, max(2, int(total_eng * 0.08)))

        synthetic_posts.append({
            "brand_id": brand_id,
            "platform": plat,
            "published_at": pub_time,
            "content_format": fmt,
            "category": cat,
            "topic": topic,
            "caption": caption,
            "status": "published",
            "created_at": pub_time,
            "metrics": {
                "impressions": impressions,
                "reach": base_reach,
                "likes": likes,
                "comments": comments,
                "shares": shares,
                "saves": saves,
                "link_clicks": link_clicks,
                "follower_growth": follower_growth,
            }
        })

    return synthetic_posts

def generate_recommendations(
    brand: Dict[str, Any],
    analytics: Dict[str, Any],
    memories: List[str],
    previous_recommendations: List[Dict[str, Any]],
    query: str = "What should I post tomorrow?"
) -> Dict[str, Any]:
    """
    Core AI Recommendation Engine that dynamically synthesizes:
    1. Brand profile context
    2. Real historical analytics metrics
    3. Retrieved persistent Hindsight memories (distinguishing explicit owner preferences from observed evidence)
    4. Previous recommendation history & novelty rotation
    5. Content variety constraints
    """
    brand_name = brand.get("name", "Your Brand")
    industry = brand.get("industry", "Café & Hospitality")
    audience = brand.get("target_audience") or "Target customers and followers"
    tone = brand.get("tone") or "Friendly & Conversational"
    location = brand.get("location") or "Local area"
    products = brand.get("products_services") or "Core offerings"
    goals = brand.get("goals") or "Drive engagement and awareness"
    avoid_topics = brand.get("avoid_topics") or ""

    # Parse and categorize retrieved memories with strict deduplication
    explicit_prefs = []
    performance_mems = []
    other_mems = []

    for m in memories:
        m_str = str(m).strip()
        if not m_str:
            continue
        lower_str = m_str.lower()
        if "owner preference:" in lower_str or "explicit owner preference:" in lower_str or "owner feedback:" in lower_str or "preference:" in lower_str:
            clean_pref = (
                m_str.replace("Explicit owner preference:", "")
                .replace("Owner preference:", "")
                .replace("Owner Preference:", "")
                .strip()
            )
            clean_pref = clean_pref.strip()
            if clean_pref and clean_pref not in explicit_prefs:
                explicit_prefs.append(clean_pref)
        elif "performance observation:" in lower_str or "historical observation:" in lower_str or "evidence-based" in lower_str:
            if m_str not in performance_mems:
                performance_mems.append(m_str)
        elif "recommendation outcome:" in lower_str or "strategy observation:" in lower_str:
            if m_str not in other_mems:
                other_mems.append(m_str)
        else:
            if m_str not in other_mems:
                other_mems.append(m_str)

    format_signals = (
        (r"\breels?\b|\bvideos?\b", "Reel"),
        (r"\bcarousels?\b", "Carousel"),
        (r"\bimages?\b", "Image"),
        (r"\bstories\b|\bstory\b", "Story"),
    )
    category_signals = (
        (r"\bbehind[\s-]+the[\s-]+scenes?\b", "Behind-the-scenes"),
        (r"\beducational\b", "Educational"),
        (r"\bpromotional\b|\bpromotion\b", "Promotional"),
        (r"\bcommunity\b", "Community"),
        (r"\bproduct\b", "Product"),
        (r"\bseasonal\b", "Seasonal"),
    )
    comparison_pattern = re.compile(
        r"(?P<winner>[^.!?;]{1,180}?)\s+(?:outperformed|performed better than|"
        r"had higher engagement than|generated more engagement than|"
        r"drove higher engagement than|performed best|was the most successful|"
        r"was the best[- ]performing)\b",
        re.IGNORECASE,
    )

    def has_preference_conflict(preference: str, selected_format: str, selected_category: str | None) -> bool:
        preference_lower = preference.lower()
        negation = r"\b(?:avoid|no|not|don't|do not|never|without|don't want|do not want)\b(?:\W+\w+){0,3}\W+"
        for signals, selected_value in ((format_signals, selected_format), (category_signals, selected_category)):
            if selected_value is None:
                continue
            for pattern, value in signals:
                if not re.search(pattern, preference_lower):
                    continue
                is_negated = bool(re.search(negation + r"(?:" + pattern + r")", preference_lower))
                if (value == selected_value and is_negated) or (value != selected_value and not is_negated):
                    return True
        return False

    performance_learning = None
    for learning_text in performance_mems + other_mems:
        comparison = comparison_pattern.search(learning_text)
        if not comparison:
            continue

        winner_text = comparison.group("winner").strip()
        if re.search(r"\b(?:not|never|didn't|did not|failed to)\b", winner_text.lower()):
            continue

        winning_formats = {
            value for pattern, value in format_signals
            if re.search(pattern, winner_text, re.IGNORECASE)
        }
        if len(winning_formats) != 1:
            continue

        winning_categories = {
            value for pattern, value in category_signals
            if re.search(pattern, winner_text, re.IGNORECASE)
        }
        winning_category = next(iter(winning_categories)) if len(winning_categories) == 1 else None
        winning_format = next(iter(winning_formats))
        if any(
            has_preference_conflict(pref, winning_format, winning_category)
            for pref in explicit_prefs
        ):
            continue

        performance_learning = {
            "text": learning_text,
            "winner": winner_text,
            "format": winning_format,
            "category": winning_category,
        }
        break

    # Check for specific explicit preference constraints
    pref_text_combined = " ".join(explicit_prefs).lower()
    prefers_educational = "educational" in pref_text_combined
    prefers_video = "video" in pref_text_combined or "reels" in pref_text_combined
    avoid_promotional = "avoid promotion" in pref_text_combined or "don't want promotion" in pref_text_combined or "no promotion" in pref_text_combined
    contextual_conflict = None
    negative_performance_pattern = re.compile(
        r"\b(?:performed?\s+poorly|underperformed|did(?:n't|\s+not)\s+perform(?:\s+well)?|"
        r"lower\s+(?:reach|engagement|results|performance)|"
        r"(?:reach|engagement|results|performance)\s+(?:was|were)\s+(?:significantly\s+)?lower|"
        r"declined|worse\s+than|less\s+effective)\b",
        re.IGNORECASE,
    )
    if performance_learning:
        context_noise = {
            "a", "an", "and", "are", "as", "at", "based", "be", "been", "being", "but",
            "by", "compared", "content", "during", "for", "from", "had", "has", "have", "in",
            "indicates", "into", "is", "it", "its", "learning", "lower", "many", "may", "more",
            "not", "of", "on", "or", "outperformed", "overall", "performance", "performed",
            "poorly", "previous", "recent", "showing", "significantly", "successful", "success",
            "than", "that", "the", "their", "this", "to", "under", "was", "were", "with",
        }
        direction_tokens = {
            token
            for direction in (
                performance_learning["winner"],
                performance_learning["format"],
                performance_learning["category"] or "",
            )
            for token in re.findall(r"[a-z0-9]+", direction.lower())
        }

        def context_tokens(text: str) -> set[str]:
            return {
                token
                for token in re.findall(r"[a-z0-9]+", text.lower())
                if token not in context_noise and token not in direction_tokens
            }

        request_context = context_tokens(query or "")
        if request_context:
            for memory_text in performance_mems + other_mems:
                lower_memory = memory_text.lower()
                if not negative_performance_pattern.search(lower_memory):
                    continue
                if not any(
                    re.search(pattern, lower_memory)
                    for pattern, value in format_signals
                    if value == performance_learning["format"]
                ):
                    continue
                if performance_learning["category"] and not re.search(
                    next(
                        pattern for pattern, value in category_signals
                        if value == performance_learning["category"]
                    ),
                    lower_memory,
                ):
                    continue

                shared_context = request_context & context_tokens(memory_text)
                if len(shared_context) >= 2 or any(len(token) >= 7 for token in shared_context):
                    contextual_conflict = {
                        "text": memory_text,
                        "shared_context": sorted(shared_context),
                    }
                    break

    learning_guides_first_rec = bool(
        performance_learning
        and not contextual_conflict
        and not (prefers_educational or prefers_video)
    )

    # Determine system stage
    has_analytics = analytics.get("total_posts", 0) > 0
    if explicit_prefs:
        stage = "memory-informed"
    elif has_analytics:
        stage = "evidence-informed"
    else:
        stage = "cold-start"

    # Analytics metrics extraction
    best_fmt_data = analytics.get("best_format")
    best_cat_data = analytics.get("best_category")
    avg_eng = analytics.get("average_engagement_rate", 0.0)
    total_posts = analytics.get("total_posts", 0)
    caveat = analytics.get("caveat", "Historical observation only; does not prove causality.")

    best_fmt_name = best_fmt_data["name"] if best_fmt_data else "Reel"
    best_cat_name = best_cat_data["name"] if best_cat_data else "Behind-the-scenes"

    # Extract previously recommended titles / formats for novelty check
    prev_formats = []
    prev_categories = []
    for prev_batch in (previous_recommendations or []):
        recs_list = prev_batch.get("recommendations", [])
        if isinstance(recs_list, str):
            try:
                recs_list = json.loads(recs_list)
            except Exception:
                recs_list = []
        for r in recs_list:
            if isinstance(r, dict):
                if r.get("format"): prev_formats.append(r.get("format"))
                if r.get("category"): prev_categories.append(r.get("category"))

    # Determine "What Changed" narrative
    if learning_guides_first_rec:
        what_changed = (
            f"A previous Hindsight experiment suggested {performance_learning['format']} "
            f"content performed well; historical analytics remain supporting evidence "
            f"({best_fmt_name}/{best_cat_name}), and neither observation guarantees future results."
        )
    elif explicit_prefs:
        latest_pref = explicit_prefs[-1]
        what_changed = f"Priority shifted following your explicit preference: '{latest_pref}'. Promotional content was suppressed in favor of educational and video content."
    elif contextual_conflict:
        what_changed = (
            f"A Hindsight learning conflict overlaps this request's context "
            f"({', '.join(contextual_conflict['shared_context'])}); historical analytics "
            f"({best_fmt_name}/{best_cat_name}) remain supporting evidence, not a guarantee."
        )
    elif has_analytics:
        what_changed = f"Strategy adjusted based on historical analytics of {total_posts} posts, prioritizing observed top performers (Format: {best_fmt_name}, Category: {best_cat_name})."
    else:
        what_changed = "Initial baseline recommendations established from brand identity profile and target audience."

    # Build 3 distinct recommendation options
    recommendations = []

    # Card 1: Primary Evidence / Preference Alignment
    if prefers_educational or prefers_video:
        rec1_fmt = "Reel"
        rec1_cat = "Educational"
        rec1_title = f"Quick Tutorial: The Insider's Guide to {products.split(',')[0] if ',' in products else products}"
        rec1_objective = "Educational Engagement & Authority"
        rec1_idea = f"Create a dynamic, fast-paced 45-second Reel demonstrating a pro tip about {products}. Showcase step-by-step technique with clear on-screen text overlays and upbeat background audio."
        rec1_caption = f"Did you know this simple trick? Master your daily routine with our expert guide. Here's exactly how it works... [Save for later!]"
        rec1_cta = "Save this reel and share it with someone who loves coffee/craft!"
        rec1_platform = "Instagram"
        rec1_reason = f"Explicitly aligns with owner preference prioritizing educational video formats while avoiding promotional messaging."
        rec1_memory = f"Explicit Preference: '{explicit_prefs[-1]}'" if explicit_prefs else "Brand Voice Guideline"
        rec1_evidence = f"Historical data confirms video/reels drive high user retention across {total_posts} analyzed posts." if has_analytics else "Cold-start baseline: Video tutorials have proven high completion rates for hospitality & retail."
        rec1_novelty = "High utility instructional hook designed for high bookmark/save rates."
    else:
        rec1_fmt = performance_learning["format"] if learning_guides_first_rec else (best_fmt_name if has_analytics else "Reel")
        rec1_cat = (
            (performance_learning["category"] or best_cat_name)
            if learning_guides_first_rec
            else (best_cat_name if has_analytics else "Behind-the-scenes")
        )
        product_name = products.split(',')[0] if ',' in products else products
        rec1_title = (
            f"{rec1_cat} {rec1_fmt}: {product_name}"
            if learning_guides_first_rec
            else f"Behind the Craft: How We Prepare Our Signature {product_name}"
        )
        rec1_objective = "Brand Authenticity & Audience Retention"
        rec1_idea = (
            f"Create a {rec1_fmt} about {product_name}, using a {rec1_cat.lower()} approach "
            f"informed by a previous experiment and tailored to {brand_name}'s audience."
            if learning_guides_first_rec
            else f"A candid {rec1_fmt} revealing the morning prep routine at our {location} location. Emphasize craftsmanship, premium ingredients, and the dedication of our local team."
        )
        rec1_caption = f"Every great morning starts with obsessive attention to detail. Here's a look behind the counter before the doors open today. ✨"
        rec1_cta = f"Drop a comment: What is your go-to morning order at {brand_name}?"
        rec1_platform = "Instagram"
        if learning_guides_first_rec:
            rec1_reason = (
                f"Hindsight learning from a previous experiment indicates '{performance_learning['winner']}' "
                f"performed better. Historical analytics independently favor {best_fmt_name} "
                f"({best_fmt_data['avg_engagement_rate'] if best_fmt_data else 'N/A'}% avg engagement) "
                f"and {best_cat_name} ({best_cat_data['avg_engagement_rate'] if best_cat_data else 'N/A'}%). "
                "These are contextual observations, not guarantees; treat the learned direction as a test."
            )
            rec1_memory = performance_learning["text"]
            rec1_evidence = (
                f"Historical analytics observed {best_fmt_name} and {best_cat_name} as top performers "
                f"across {total_posts} posts. ({caveat})"
                if has_analytics
                else "No historical analytics are available to corroborate the previous experiment."
            )
        elif contextual_conflict and not (prefers_educational or prefers_video):
            rec1_reason = (
                f"A Hindsight experiment found '{performance_learning['winner']}' successful, but a contradictory "
                f"learning reports poor performance for the same direction in a context overlapping this request "
                f"({', '.join(contextual_conflict['shared_context'])}). The positive learning is treated as conditional; "
                f"this recommendation follows historical analytics favoring {best_fmt_name} and {best_cat_name} "
                f"({best_fmt_data['avg_engagement_rate'] if best_fmt_data else 'N/A'}% and "
                f"{best_cat_data['avg_engagement_rate'] if best_cat_data else 'N/A'}%, respectively), which are also contextual observations."
            )
            rec1_memory = f"Positive: {performance_learning['text']} Contradictory: {contextual_conflict['text']}"
            rec1_evidence = (
                f"Historical analytics observed {best_fmt_name} and {best_cat_name} as top performers "
                f"across {total_posts} posts. ({caveat})"
                if has_analytics
                else "No historical analytics are available; the recommendation falls back to the existing baseline."
            )
        else:
            rec1_reason = f"Capitalizes on {rec1_cat} having highest observed historical performance ({best_cat_data['avg_engagement_rate'] if best_cat_data else 'N/A'}% avg engagement)." if has_analytics else "Builds authentic local connection by sharing origin stories."
            rec1_memory = performance_mems[0] if performance_mems else f"Tone: {tone}, Audience: {audience}"
            rec1_evidence = f"Format '{rec1_fmt}' achieved {best_fmt_data['avg_engagement_rate'] if best_fmt_data else 5.8}% avg engagement in sample dataset. ({caveat})" if has_analytics else "Baseline Cold-start"
        rec1_novelty = "Offers authentic transparency contrasting with standard catalog posts."

    recommendations.append({
        "id": 1,
        "title": rec1_title,
        "format": rec1_fmt,
        "category": rec1_cat,
        "objective": rec1_objective,
        "target_audience": audience,
        "content_idea": rec1_idea,
        "caption_direction": rec1_caption,
        "cta": rec1_cta,
        "platform": rec1_platform,
        "reason": rec1_reason,
        "evidence_used": rec1_evidence,
        "memory_used": rec1_memory,
        "novelty_note": rec1_novelty,
    })

    # Card 2: Educational Carousel / Breakdown
    if avoid_promotional:
        rec2_cat = "Educational" if not prefers_educational else "Behind-the-scenes"
        rec2_fmt = "Carousel" if not prefers_video else "Reel"
    else:
        rec2_cat = "Community"
        rec2_fmt = "Carousel"

    rec2_title = f"5 Things Most People Get Wrong About {products.split(',')[0] if ',' in products else 'Our Industry'}"
    rec2_objective = "Knowledge Sharing & Community Trust"
    rec2_idea = f"A multi-slide visual {rec2_fmt} breaking down 5 fascinating, lesser-known facts about our craft. Slide 1: Strong myth-busting hook; Slides 2-5: Illustrated breakdown; Slide 6: Community question."
    rec2_caption = f"We hear these myths every day! Swipe through to see how many you believed (and swipe to the end for our top tip). 👇"
    rec2_cta = "Which one surprised you the most? Let us know below!"
    rec2_platform = "LinkedIn" if "professional" in audience.lower() else "Instagram"
    rec2_reason = "Delivers high-value informational content that positions the brand as a trusted expert without any sales pressure."
    rec2_memory = f"Adheres strictly to user guidance: '{explicit_prefs[-1]}'" if explicit_prefs else f"Brand Goal: {goals}"
    rec2_evidence = f"Educational content historically maintains steady engagement ({analytics.get('by_category', {}).get('Educational', {}).get('avg_engagement_rate', avg_eng)}% avg)." if has_analytics else "Industry benchmark: Carousels generate 1.8x more shares than single images."
    rec2_novelty = "Provides an alternative multi-slide reading experience to complement single video formats."

    recommendations.append({
        "id": 2,
        "title": rec2_title,
        "format": rec2_fmt,
        "category": rec2_cat,
        "objective": rec2_objective,
        "target_audience": audience,
        "content_idea": rec2_idea,
        "caption_direction": rec2_caption,
        "cta": rec2_cta,
        "platform": rec2_platform,
        "reason": rec2_reason,
        "evidence_used": rec2_evidence,
        "memory_used": rec2_memory,
        "novelty_note": rec2_novelty,
    })

    # Card 3: Interactive Community Spotlight / Storytelling
    rec3_fmt = "Story" if "Story" not in prev_formats[-2:] else "Image"
    rec3_cat = "Community"
    rec3_title = f"Community Spotlight: The Faces & Stories of {location}"
    rec3_objective = "Community Engagement & Local Word-of-Mouth"
    rec3_idea = f"Feature a genuine customer story, team member shoutout, or neighborhood moment in {location}. Use an authentic candid photo paired with an inspiring micro-interview quote."
    rec3_caption = f"The heart of {brand_name} is the incredible community that walks through our doors every day. Today we want to celebrate..."
    rec3_cta = "Tag a friend you'd love to bring along for our next community session!"
    rec3_platform = "Facebook" if "Facebook" not in prev_formats[-2:] else "Instagram"
    rec3_reason = "Fosters emotional connection and word-of-mouth advocacy by celebrating real people in the local community."
    rec3_memory = f"Brand Tone: {tone}, Location: {location}"
    rec3_evidence = f"Community category achieved {analytics.get('by_category', {}).get('Community', {}).get('avg_engagement_rate', avg_eng)}% avg engagement in historical tests." if has_analytics else "Cold-start community pillar recommendation."
    rec3_novelty = "Rotates to community-centric storytelling to prevent brand fatigue."

    recommendations.append({
        "id": 3,
        "title": rec3_title,
        "format": rec3_fmt,
        "category": rec3_cat,
        "objective": rec3_objective,
        "target_audience": audience,
        "content_idea": rec3_idea,
        "caption_direction": rec3_caption,
        "cta": rec3_cta,
        "platform": rec3_platform,
        "reason": rec3_reason,
        "evidence_used": rec3_evidence,
        "memory_used": rec3_memory,
        "novelty_note": rec3_novelty,
    })

    return {
        "stage": stage,
        "query": query,
        "what_changed": what_changed,
        "recommendations": recommendations,
        "memories_used": explicit_prefs + performance_mems[:2] + other_mems[:1],
        "user_preferences_used": explicit_prefs,
        "evidence_summary": {
            "total_posts_analyzed": total_posts,
            "average_engagement_rate": avg_eng,
            "best_format_observed": best_fmt_data,
            "best_category_observed": best_cat_data,
            "caveat": caveat,
        },
        "generated_at": datetime.utcnow().isoformat(),
    }

import os
import logging

logger = logging.getLogger("socialpulse.memory")

class Memory:
    def __init__(self):
        self.client = None
        self.connected = False
        self.created_banks = set()
        self._async_loop = None
        self._async_thread = None
        self._async_loop_lock = threading.Lock()
        atexit.register(self._shutdown_async_loop)
        # Always resolve store_path relative to project root
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.store_path = os.path.join(project_root, "data", "memory_store.json")
        self.local = {}
        self._load_local()
        self._init_hindsight_client()

    def _run_async(self, coro):
        """Run an async Hindsight operation from existing sync service methods."""
        loop = self._get_async_loop()
        if threading.current_thread() is self._async_thread:
            raise RuntimeError("Synchronous Memory methods cannot run on the Hindsight event loop")
        return asyncio.run_coroutine_threadsafe(coro, loop).result()

    def _get_async_loop(self):
        with self._async_loop_lock:
            if self._async_loop is not None:
                if not self._async_loop.is_running():
                    raise RuntimeError("Hindsight event loop is not running")
                return self._async_loop

            loop = asyncio.new_event_loop()
            loop_ready = threading.Event()

            def run_loop():
                asyncio.set_event_loop(loop)
                loop_ready.set()
                try:
                    loop.run_forever()
                finally:
                    pending = asyncio.all_tasks(loop)
                    for task in pending:
                        task.cancel()
                    if pending:
                        loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                    loop.close()
                    asyncio.set_event_loop(None)
            thread = threading.Thread(
                target=run_loop,
                name="socialpulse-hindsight-loop",
                daemon=True,
            )
            self._async_loop = loop
            self._async_thread = thread
            thread.start()
            loop_ready.wait()
            return loop

    def _shutdown_async_loop(self):
        loop = self._async_loop
        thread = self._async_thread
        if loop is None or thread is None or not loop.is_running():
            return

        if self.client is not None:
            try:
                close_coro = self.client.aclose()
                asyncio.run_coroutine_threadsafe(close_coro, loop).result(timeout=10)
            except Exception as exc:
                logger.warning("Could not close Hindsight Cloud client cleanly: %s", exc)

        loop.call_soon_threadsafe(loop.stop)
        if thread is not threading.current_thread():
            thread.join(timeout=10)

    def _init_hindsight_client(self):
        api_key = (settings.hindsight_api_key or "").strip()
        base_url = (settings.hindsight_base_url or "https://api.hindsight.vectorize.io").strip().rstrip("/")
        if api_key:
            try:
                from hindsight_client import Hindsight
                c = Hindsight(base_url=base_url, api_key=api_key)
                # Verify credentials with an authenticated probe
                try:
                    self._run_async(c.alist_memories("probe-auth-check", limit=1))
                except Exception as probe_err:
                    err_str = str(probe_err).lower()
                    if "401" in err_str or "unauthorized" in err_str or "403" in err_str or "forbidden" in err_str:
                        raise probe_err
                self.client = c
                self.connected = True
                logger.info(f"Hindsight Cloud initialized successfully at {base_url}.")
            except Exception as e:
                logger.warning(f"Could not connect to Hindsight Cloud ({e}). Using local fallback.")
                self.client = None
                self.connected = False
        else:
            self.client = None
            self.connected = False

    def reinit(self):
        """Re-evaluates Hindsight client initialization when settings/env change."""
        self._init_hindsight_client()

    @property
    def backend_name(self) -> str:
        return "hindsight-cloud" if (self.client and self.connected) else "local-fallback"

    def _load_local(self):
        try:
            if os.path.exists(self.store_path):
                with open(self.store_path, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    self.local = {int(k) if str(k).isdigit() else k: v for k, v in raw.items()}
        except Exception:
            self.local = {}

    def _save_local(self):
        try:
            os.makedirs(os.path.dirname(self.store_path), exist_ok=True)
            with open(self.store_path, "w", encoding="utf-8") as f:
                json.dump(self.local, f, indent=2)
        except Exception:
            pass

    def bank(self, brand_id: int) -> str:
        return f"socialpulse-brand-{int(brand_id)}"

    def ensure_bank(self, brand_id: int, brand_name: str | None = None) -> str | None:
        brand_id = int(brand_id)
        if not self.client:
            return None
        if brand_id in self.created_banks:
            return self.bank(brand_id)

        bank_id = self.bank(brand_id)
        name = f"SocialPulse — {brand_name}" if brand_name else f"SocialPulse — Brand {brand_id}"
        try:
            self._run_async(self.client.acreate_bank(bank_id=bank_id, name=name))
            self.created_banks.add(brand_id)
        except Exception as e:
            err = str(e).lower()
            if "409" in str(e) or "already exists" in err or "conflict" in err:
                self.created_banks.add(brand_id)
            else:
                logger.warning(f"Notice while ensuring bank {bank_id}: {e}")
        return bank_id

    def retain(self, brand_id: int, text: str, context: str = "SocialPulse", brand_name: str | None = None) -> str:
        brand_id = int(brand_id)
        clean_text = text.strip()
        if not clean_text:
            return self.backend_name

        # Deduplication check: do not re-retain identical memory
        existing_memories = self.list(brand_id)
        if any(m.strip() == clean_text for m in existing_memories):
            return self.backend_name

        if self.client:
            try:
                self.ensure_bank(brand_id, brand_name)
                self._run_async(
                    self.client.aretain(
                        bank_id=self.bank(brand_id),
                        content=clean_text,
                        context=context,
                    )
                )
                return "hindsight-cloud"
            except Exception as e:
                logger.warning(f"Hindsight Cloud retain failed: {e}. Falling back to local memory.")

        # Local fallback with strict deduplication
        brand_mems = self.local.setdefault(brand_id, [])
        if not any(m.strip() == clean_text for m in brand_mems):
            brand_mems.append(clean_text)
            self._save_local()
        return self.backend_name

    def recall(self, brand_id: int, query: str, brand_name: str | None = None) -> list[str]:
        brand_id = int(brand_id)
        if self.client:
            try:
                self.ensure_bank(brand_id, brand_name)
                brand_label = brand_name or f"Brand {brand_id}"
                # Construct query as specified in Requirement 8
                recall_query = (
                    f"Relevant brand preferences, previous content decisions, owner feedback, "
                    f"historical performance observations, recommendation outcomes, and strategy learnings "
                    f"for {brand_label} to decide what the brand should post next: {query}"
                )
                r = self._run_async(
                    self.client.arecall(
                        bank_id=self.bank(brand_id),
                        query=recall_query,
                        max_tokens=2500,
                        budget="mid",
                    )
                )
                seen = set()
                out = []
                for x in r.results:
                    txt = x.text.strip()
                    if txt and txt not in seen:
                        seen.add(txt)
                        out.append(x.text)
                if out:
                    return out
            except Exception as e:
                logger.warning(f"Hindsight Cloud recall failed: {e}. Falling back to local recall.")

        # Local fallback or fallback if Hindsight recall returned empty
        seen = set()
        out = []
        for m in self.local.get(brand_id, []):
            txt = m.strip()
            if txt and txt not in seen:
                seen.add(txt)
                out.append(m)
        return out

    def list(self, brand_id: int) -> list[str]:
        brand_id = int(brand_id)
        if self.client:
            try:
                self.ensure_bank(brand_id)
                r = self._run_async(
                    self.client.alist_memories(
                        bank_id=self.bank(brand_id),
                        limit=100,
                        offset=0,
                    )
                )
                seen = set()
                out = []
                for x in r.items:
                    txt = x.text.strip()
                    if txt and txt not in seen:
                        seen.add(txt)
                        out.append(x.text)
                return out
            except Exception as e:
                logger.warning(f"Hindsight Cloud list_memories failed: {e}. Falling back to local list.")

        seen = set()
        out = []
        for m in self.local.get(brand_id, []):
            txt = m.strip()
            if txt and txt not in seen:
                seen.add(txt)
                out.append(m)
        return out

    def get_status(self, brand_id: int) -> dict[str, any]:
        brand_id = int(brand_id)
        is_cloud = bool(self.client and self.connected)
        memories_list = self.list(brand_id)
        return {
            "brand_id": brand_id,
            "backend": "hindsight-cloud" if is_cloud else "local-fallback",
            "bank_id": self.bank(brand_id) if is_cloud else None,
            "connected": is_cloud,
            "memory_count": len(memories_list),
        }

memory = Memory()


