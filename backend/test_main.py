import logging

import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(main, "model_present", lambda: async_true())
    with TestClient(main.app) as test_client:
        yield test_client


async def async_true():
    return True


def test_questions_contract_and_exact_count(client, monkeypatch):
    async def fake_generate(*args, **kwargs):
        return {"questions": [{"id": f"q{i}", "text": f"Question {i}?"} for i in range(1, 4)]}
    monkeypatch.setattr(main, "generate", fake_generate)
    response = client.post("/v1/questions", json={"topic": "career", "mood": "curious", "language": "en", "durationMinutes": 20})
    assert response.status_code == 200
    assert len(response.json()["questions"]) == 3
    assert response.json()["requestId"]


def test_invalid_question_request(client):
    response = client.post("/v1/questions", json={"topic": "career", "mood": "curious", "language": "en", "durationMinutes": 15})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"


def test_journal_discards_unsubstantiated_quotes(client, monkeypatch):
    async def fake_generate(*args, **kwargs):
        return {"title": "A walk", "reflections": [{"text": "You said pace felt enough.", "supportingQuote": "natural pace is enough"}], "ideas": [
            {"text": "Supported", "supportingQuote": "natural pace is enough"},
            {"text": "Unsupported", "supportingQuote": "my family moved away"}], "question": None,
            "nextStep": "Go for a walk", "nextStepQuote": "leave my phone away"}
    monkeypatch.setattr(main, "generate", fake_generate)
    response = client.post("/v1/journal", json={"language": "en", "topic": "life", "transcripts": [{"clipId": "c1", "text": "My natural   pace is enough; I want to leave my phone away tomorrow."}]})
    assert response.status_code == 200
    assert [i["text"] for i in response.json()["ideas"]] == ["Supported"]
    assert response.json()["nextStep"] == "I want to leave my phone away tomorrow."


def test_invalid_journal_output_returns_error(client, monkeypatch):
    async def fake_generate(*args, **kwargs): return {"title": "", "reflections": [], "ideas": []}
    monkeypatch.setattr(main, "generate", fake_generate)
    response = client.post("/v1/journal", json={"language": "en", "topic": "life", "transcripts": [{"clipId": "c1", "text": "I felt quiet."}]})
    assert response.status_code == 502


def test_journal_rejects_unsupported_reflections(client, monkeypatch):
    async def fake_generate(*args, **kwargs):
        return {"title": "A walk", "reflections": [{"text": "Your work schedule became flexible.", "supportingQuote": "flexible schedule"}],
                "ideas": [], "question": None, "nextStep": "Set a calendar reminder", "nextStepQuote": "tomorrow"}
    monkeypatch.setattr(main, "generate", fake_generate)
    response = client.post("/v1/journal", json={"language": "en", "topic": "life", "transcripts": [{"clipId": "c1", "text": "I want to make time to walk."}]})
    assert response.status_code == 502


def test_missing_model_and_timeout_envelopes():
    # Exercise generation directly without depending on an installed Ollama.
    async def call():
        async def absent(): return False
        original = main.model_present
        main.model_present = absent
        try:
            with pytest.raises(main.ApiError) as error:
                await main.generate("prompt", {}, 1)
            assert error.value.status == 503
        finally: main.model_present = original
    import asyncio
    asyncio.run(call())


def test_model_timeout_maps_to_504(monkeypatch):
    class TimeoutClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return None
        async def post(self, *args, **kwargs): raise main.httpx.TimeoutException("inference timeout")
    async def present(): return True
    monkeypatch.setattr(main, "model_present", present)
    monkeypatch.setattr(main.httpx, "AsyncClient", TimeoutClient)
    import asyncio
    with pytest.raises(main.ApiError) as error:
        asyncio.run(main.generate("prompt", {}, 0.01))
    assert error.value.status == 504


def test_generate_parses_ollama_text_and_chat_shapes(monkeypatch):
    class FakeResponse:
        status_code = 200
        def __init__(self, payload): self.payload = payload
        def raise_for_status(self): pass
        def json(self): return self.payload
    class FakeClient:
        payloads = [
            {"response": '```json\n{"questions": []}\n```'},
            {"message": {"content": '{"questions": []}' }},
        ]
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return None
        async def get(self, *args, **kwargs): return FakeResponse({"models": [{"name": main.MODEL}]})
        async def post(self, *args, **kwargs): return FakeResponse(self.payloads.pop(0))
    monkeypatch.setattr(main.httpx, "AsyncClient", FakeClient)
    import asyncio
    async def run():
        assert await main.generate("prompt", {}, 1) == {"questions": []}
        assert await main.generate("prompt", {}, 1) == {"questions": []}
    asyncio.run(run())


def test_cors_and_private_log_hygiene(client, caplog, monkeypatch):
    async def fake_generate(*args, **kwargs):
        return {"questions": [{"id": f"q{i}", "text": f"Q{i}?"} for i in range(3)]}
    monkeypatch.setattr(main, "generate", fake_generate)
    caplog.set_level(logging.INFO, logger="chalte.api")
    private = "SECRET_CONTEXT_SHOULD_NOT_APPEAR"
    response = client.post("/v1/questions", headers={"Origin": "http://localhost:5173"}, json={"topic": "career", "mood": "curious", "context": private, "language": "en", "durationMinutes": 20})
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert private not in caplog.text


