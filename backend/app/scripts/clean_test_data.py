import sys
import os
# Ensure project root is on PYTHONPATH so that imports work
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.append(project_root)

from sqlalchemy.orm import Session
from backend.app.db import SessionLocal, engine
from backend.app.models import Brand, Post, Recommendation
from backend.app.services import memory

def clean_test_brands():
    """Delete brands that appear to be test data (e.g., names containing 'Test')
    and remove associated posts, recommendations, and memories.
    """
    session = SessionLocal()
    try:
        # Identify test brands (case‑insensitive match for 'test')
        test_brands = session.query(Brand).filter(Brand.name.ilike('%test%')).all()
        for b in test_brands:
            brand_id = b.id
            print(f'Deleting test brand: {b.name} (id={brand_id})')
            # Delete posts linked to the brand
            session.query(Post).filter(Post.brand_id == brand_id).delete(synchronize_session=False)
            # Delete recommendations linked to the brand
            session.query(Recommendation).filter(Recommendation.brand_id == brand_id).delete(synchronize_session=False)
            # Remove local fallback memories for the brand, if they exist
            if hasattr(memory, 'local') and brand_id in memory.local:
                del memory.local[brand_id]
                memory._save_local()
            # Finally delete the brand record itself
            session.delete(b)
        session.commit()
        print('Cleanup of test brands completed.')
    except Exception as e:
        session.rollback()
        print(f'Error during cleanup: {e}', file=sys.stderr)
    finally:
        session.close()

if __name__ == '__main__':
    clean_test_brands()
