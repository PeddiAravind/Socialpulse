from backend.app.services import rate, insights

def test_rate():
    assert rate({"reach":100,"likes":10,"comments":5,"shares":3,"saves":2}) == 20.0

def test_zero_reach():
    assert rate({"reach":0,"likes":10,"comments":5,"shares":3,"saves":2}) == 0.0

def test_insights():
    rows=[
      {"reach":100,"likes":10,"comments":0,"shares":0,"saves":0,"content_format":"Image"},
      {"reach":100,"likes":20,"comments":0,"shares":0,"saves":0,"content_format":"Short video"},
    ]
    text,avg=insights(rows)
    assert avg["Short video"] > avg["Image"]

def test_generate_recommendations_cold_start():
    from backend.app.services import generate_recommendations
    brand = {
        "name": "Test Café",
        "industry": "Café & Hospitality",
        "target_audience": "Coffee lovers",
        "tone": "Friendly",
        "products_services": "Cold Brew",
        "goals": "Grow community"
    }
    rec = generate_recommendations(brand=brand, analytics={}, memories=[], previous_recommendations=[])
    assert rec["stage"] == "cold-start"
    assert len(rec["recommendations"]) == 3

def test_generate_recommendations_with_preference():
    from backend.app.services import generate_recommendations
    brand = {
        "name": "Test Café",
        "industry": "Café & Hospitality",
        "target_audience": "Coffee lovers",
        "tone": "Friendly",
        "products_services": "Cold Brew",
        "goals": "Grow community"
    }
    memories = ["Owner preference:\nI prefer educational videos and don't want promotional content this week."]
    rec = generate_recommendations(brand=brand, analytics={}, memories=memories, previous_recommendations=[])
    assert rec["stage"] == "memory-informed"
    assert "educational" in rec["what_changed"].lower()
    # Verify primary format is Video / Reel and category is Educational
    assert rec["recommendations"][0]["category"] == "Educational"
    assert rec["recommendations"][0]["format"] == "Reel"

def test_memory_bank_id():
    from backend.app.services import memory
    assert memory.bank(6) == "socialpulse-brand-6"
    assert memory.bank("42") == "socialpulse-brand-42"

def test_memory_status_structure():
    from backend.app.services import memory
    status = memory.get_status(6)
    assert status["brand_id"] == 6
    assert status["backend"] in ["hindsight-cloud", "local-fallback"]
    assert "memory_count" in status
    assert "connected" in status

def test_memory_deduplication_local():
    from backend.app.services import memory
    test_brand = 9999
    # Clear local memories for this test brand
    memory.local[test_brand] = []
    memory.retain(test_brand, "Owner preference:\nTest preference 1")
    memory.retain(test_brand, "Owner preference:\nTest preference 1")
    mems = memory.list(test_brand)
    assert len([m for m in mems if "Test preference 1" in m]) == 1

