import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services import Memory, generate_recommendations

client = TestClient(app)

def test_health_endpoint_fallback():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["memory_backend"] in ["hindsight-cloud", "local-fallback"]

def test_memory_status_endpoint():
    response = client.get("/api/brands/6/memory/status")
    assert response.status_code == 200
    data = response.json()
    assert data["brand_id"] == 6
    assert data["backend"] in ["hindsight-cloud", "local-fallback"]
    assert "memory_count" in data
    assert "connected" in data

def test_bank_id_deterministic_format():
    mem = Memory()
    assert mem.bank(6) == "socialpulse-brand-6"
    assert mem.bank(100) == "socialpulse-brand-100"

def test_recommendation_outcome_retention():
    # Test approving an option creates a Recommendation outcome memory
    response = client.post(
        "/api/brands/6/recommendations",
        json={"query": "What should I post tomorrow?"}
    )
    assert response.status_code == 200
    rec_data = response.json()
    rec_id = rec_data.get("recommendation_id")
    assert rec_id is not None
    assert "memory_backend" in rec_data

    # Approve recommendation
    action_resp = client.post(
        f"/api/brands/6/recommendations/{rec_id}/action",
        json={"action": "approved", "recommendation_index": 0}
    )
    assert action_resp.status_code == 200

    # Verify memory was recorded
    mem_resp = client.get("/api/brands/6/memory")
    assert mem_resp.status_code == 200
    items = mem_resp.json()["items"]
    assert any("Recommendation outcome:" in m for m in items)

def test_hindsight_cloud_mock_integration():
    mock_hindsight = MagicMock()
    mock_recall_result = MagicMock()
    mock_recall_result.text = "Owner preference:\nI prefer educational videos and don't want promotional content this week."
    mock_hindsight.recall.return_value.results = [mock_recall_result]
    
    mock_unit = MagicMock()
    mock_unit.text = "Brand profile:\nTest Café profile."
    mock_hindsight.list_memories.return_value.items = [mock_unit, mock_recall_result]

    with patch("hindsight_client.Hindsight", return_value=mock_hindsight):
        with patch("backend.app.core.config.settings.hindsight_api_key", "test_key"):
            cloud_mem = Memory()
            # Force connected with mock
            cloud_mem.client = mock_hindsight
            cloud_mem.connected = True
            
            assert cloud_mem.backend_name == "hindsight-cloud"
            
            # Retain
            backend_used = cloud_mem.retain(6, "Owner preference:\nTest preference", brand_name="Hyderabad Brew House")
            assert backend_used == "hindsight-cloud"
            assert mock_hindsight.retain.called
            
            # Recall
            recalled = cloud_mem.recall(6, "What should I post tomorrow?", brand_name="Hyderabad Brew House")
            assert len(recalled) == 1
            assert "educational videos" in recalled[0]
            assert mock_hindsight.recall.called
            
            # Status
            status = cloud_mem.get_status(6)
            assert status["backend"] == "hindsight-cloud"
            assert status["bank_id"] == "socialpulse-brand-6"
            assert status["connected"] is True
