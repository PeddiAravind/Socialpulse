"""
Official Hindsight Cloud Smoke Test for SocialPulse AI
Run with: python backend/tests/smoke_test_hindsight.py
"""
import os
import sys

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.app.core.config import settings

def main():
    api_key = os.getenv("HINDSIGHT_API_KEY") or settings.hindsight_api_key
    base_url = os.getenv("HINDSIGHT_BASE_URL") or settings.hindsight_base_url or "https://api.hindsight.vectorize.io"

    print("========================================")
    print("SocialPulse AI — Hindsight Smoke Test")
    print("========================================")
    print(f"Base URL: {base_url}")
    print(f"API Key configured: {'YES' if api_key.strip() else 'NO'}")

    if not api_key.strip():
        print("\n[SKIP] HINDSIGHT_API_KEY is not set. To test with real Hindsight Cloud credentials:")
        print("  1. Add HINDSIGHT_API_KEY=your_key to .env")
        print("  2. Run: python backend/tests/smoke_test_hindsight.py")
        print("Local fallback is active and fully functional.\n")
        return 0

    try:
        from hindsight_client import Hindsight
        client = Hindsight(base_url=base_url.rstrip("/"), api_key=api_key.strip())
        
        bank_id = "socialpulse-brand-test-smoke"
        print(f"\n1. Ensuring bank: {bank_id}...")
        try:
            bank = client.create_bank(bank_id=bank_id, name="SocialPulse — Smoke Test Bank")
            print(f"   Bank created: {bank_id}")
        except Exception as e:
            if "409" in str(e) or "already exists" in str(e).lower():
                print(f"   Bank already exists: {bank_id}")
            else:
                print(f"   Bank notice: {e}")

        test_content = "Owner preference:\nI prefer educational videos and don't want promotional content this week."
        print(f"\n2. Retaining memory...")
        retain_resp = client.retain(bank_id=bank_id, content=test_content, context="Smoke Test")
        print(f"   Retain response: OK")

        print(f"\n3. Recalling memory with query 'What should I post tomorrow?'...")
        recall_resp = client.recall(
            bank_id=bank_id,
            query="Relevant brand preferences and owner feedback for deciding what to post next",
            max_tokens=2500,
            budget="mid"
        )
        print(f"   Recalled items: {len(recall_resp.results)}")
        for i, r in enumerate(recall_resp.results):
            print(f"   - Result {i+1}: {r.text[:100]}...")

        print(f"\n4. Listing memories...")
        list_resp = client.list_memories(bank_id=bank_id, limit=10, offset=0)
        print(f"   Total listed items: {len(list_resp.items)}")

        print("\n[SUCCESS] Hindsight Cloud smoke test passed successfully!")
        return 0

    except Exception as err:
        print(f"\n[ERROR] Hindsight test encountered an issue: {err}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
