import requests

API = "http://127.0.0.1:8000"

def main():
    brand_payload = {
        "name": "Hyderabad Brew House",
        "industry": "Café & Hospitality",
        "business_description": "Specialty artisanal coffee and bakery.",
        "target_audience": "Coffee connoisseurs and students",
        "tone": "Friendly & Conversational",
        "language": "English",
        "location": "Jubilee Hills, Hyderabad",
        "products_services": "Cold brews, Pour-over, Croissants",
        "goals": "Increase cafe visits and brand loyalty"
    }
    brand = requests.post(f"{API}/api/brands", json=brand_payload).json()
    bid = brand["id"]
    print("Created Brand: ID =", bid, "Name =", brand["name"])

    # 1. Cold Start
    cold_rec = requests.post(f"{API}/api/brands/{bid}/recommendations", json={"query": "What should I post tomorrow?"}).json()
    print("\n1. Cold Start Stage:", cold_rec["stage"], "| Top title:", cold_rec["recommendations"][0]["title"])

    # 2. Seed and Learn
    seed_resp = requests.post(f"{API}/api/brands/{bid}/seed").json()
    print("2. Seeded posts:", seed_resp["seeded"])
    learn_resp = requests.post(f"{API}/api/brands/{bid}/learn").json()
    print("3. Learned observations:", len(learn_resp["observations"]))

    # 3. Evidence-informed recommendation (Test A)
    rec_a = requests.post(f"{API}/api/brands/{bid}/recommendations", json={"query": "What should I post tomorrow?"}).json()
    print("\n4. Test A (Evidence-Informed): Stage =", rec_a["stage"])
    top_a = rec_a["recommendations"][0]
    print(f"   Top Option: {top_a['title']} ({top_a['format']} / {top_a['category']} on {top_a['platform']})")
    print(f"   Evidence: {top_a['evidence_used']}")

    # Approve first option in Test A
    rec_a_id = rec_a["recommendation_id"]
    app_res = requests.post(f"{API}/api/brands/{bid}/recommendations/{rec_a_id}/action", json={"action": "approved", "recommendation_index": 0}).json()
    print("   Approved option 0:", app_res)

    # 4. Test B: Add explicit user preference
    fb_res = requests.post(f"{API}/api/brands/{bid}/feedback", json={"feedback": "I prefer educational videos and don't want promotional content this week."}).json()
    print("\n5. Test B (Added Feedback):", fb_res)

    # 5. Test C: Ask 'What should I post tomorrow?' after user preference
    rec_c = requests.post(f"{API}/api/brands/{bid}/recommendations", json={"query": "What should I post tomorrow?"}).json()
    print("\n6. Test C (Memory-Informed): Stage =", rec_c["stage"])
    print("   What Changed:", rec_c["what_changed"])
    for idx, r in enumerate(rec_c["recommendations"]):
        print(f"   Option {idx+1}: {r['title']} ({r['format']} / {r['category']} on {r['platform']})")
        print(f"     Reason: {r['reason']}")
        print(f"     Memory Used: {r['memory_used']}")

    # Reject option 3 with feedback
    rec_c_id = rec_c["recommendation_id"]
    rej_res = requests.post(f"{API}/api/brands/{bid}/recommendations/{rec_c_id}/action", json={"action": "rejected", "recommendation_index": 2, "feedback": "No community spotlights for now."}).json()
    print("\n7. Rejection with feedback recorded:", rej_res)

    # Check recommendations history persistence
    hist = requests.get(f"{API}/api/brands/{bid}/recommendations").json()
    print(f"\n8. Recommendations history count: {len(hist)}")
    for h in hist:
        print(f"   - Rec ID {h['id']}: status={h['status']}, feedback={h['user_feedback']}")

if __name__ == "__main__":
    main()
