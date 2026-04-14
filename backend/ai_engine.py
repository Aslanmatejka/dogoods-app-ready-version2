"""
DoGoods AI Conversation Engine
================================
Connects OpenAI GPT-4o (reasoning), Whisper (speech-to-text), and TTS (text-to-speech).
Manages conversations: user message + ID -> profile lookup -> GPT-4o query -> text/audio response.
Includes food matching engine and environmental impact calculator.

This module is the *service layer*. FastAPI routes live in backend/app.py.

Run the API:
    uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
"""

import asyncio
import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

import httpx
from dotenv import load_dotenv

# Resolve .env files relative to the project root (parent of backend/)
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_PROJECT_ROOT, ".env.local"))
load_dotenv(os.path.join(_PROJECT_ROOT, ".env"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_engine")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# All AI calls use OpenAI (GPT-4o, Whisper, TTS)
OPENAI_BASE_URL = "https://api.openai.com/v1"
DEFAULT_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")

# Conversation engine models (OpenAI)
CHAT_MODEL = os.getenv("AI_CHAT_MODEL", "gpt-4o-mini")
WHISPER_MODEL = "whisper-1"
TTS_MODEL = "tts-1"
TTS_VOICE_EN = os.getenv("AI_TTS_VOICE", "nova")
TTS_VOICE_ES = os.getenv("AI_TTS_VOICE_ES", "nova")  # Sesame-compatible Spanish voice

MAX_RETRIES = int(os.getenv("AI_MAX_RETRIES", "2"))
TIMEOUT_SECONDS = int(os.getenv("AI_TIMEOUT", "30"))
SUPABASE_TIMEOUT = 8  # seconds for DB lookups

# Faster model for formatting tool results (follow-up calls after tool execution)
FOLLOWUP_MODEL = os.getenv("AI_FOLLOWUP_MODEL", "gpt-4o-mini")

# Shared HTTP client — reuses TCP/SSL connections across requests
_http_client: httpx.AsyncClient | None = None


def _get_http_client(timeout: float = TIMEOUT_SECONDS) -> httpx.AsyncClient:
    """Return a shared httpx.AsyncClient (connection pooling)."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=timeout)
    return _http_client

# ---------------------------------------------------------------------------
# Spanish language detection (lightweight heuristic)
# ---------------------------------------------------------------------------

_SPANISH_MARKERS = {
    "hola", "gracias", "por favor", "ayuda", "comida", "buscar",
    "quiero", "necesito", "dónde", "donde", "cómo", "como",
    "cuándo", "cuando", "tengo", "puedo", "buenos", "buenas",
    "qué", "que", "disponible", "recoger", "compartir",
    "alimentos", "comunidad", "recordatorio", "horario",
}


def detect_spanish(text: str) -> bool:
    """Fast heuristic: return True if text is likely Spanish."""
    words = set(re.split(r"\W+", text.lower()))
    # If >=2 Spanish marker words, or text has ¿ ¡ ñ accented chars
    marker_hits = len(words & _SPANISH_MARKERS)
    has_spanish_chars = bool(re.search(r"[¿¡ñáéíóúü]", text.lower()))
    return marker_hits >= 2 or (marker_hits >= 1 and has_spanish_chars)


# ---------------------------------------------------------------------------
# Canned fallback responses (used when OpenAI is unavailable)
# ---------------------------------------------------------------------------

CANNED_RESPONSES = {
    "en": {
        "timeout": (
            "I'm sorry, I'm taking a bit longer than usual to respond. "
            "Please try again in a moment. In the meantime, you can "
            "browse available food on the Find Food page or check "
            "your dashboard for updates."
        ),
        "api_down": (
            "I'm temporarily unable to connect to my AI service. "
            "Don't worry — you can still browse food listings, "
            "manage your profile, and check your schedule directly "
            "on the app. I'll be back shortly!"
        ),
        "general_error": (
            "Something went wrong on my end. Please try again, "
            "or use the app's navigation to find what you need. "
            "If the issue persists, contact support."
        ),
        "tool_error": (
            "I wasn't able to look up that information right now, "
            "but I can still help answer general questions. "
            "You can also check the app directly for the latest data."
        ),
    },
    "es": {
        "timeout": (
            "Lo siento, estoy tardando un poco más de lo normal en responder. "
            "Por favor, inténtalo de nuevo en un momento. Mientras tanto, "
            "puedes explorar los alimentos disponibles en la página "
            "Buscar Comida o revisar tu panel de control."
        ),
        "api_down": (
            "No puedo conectarme a mi servicio de inteligencia artificial "
            "en este momento. No te preocupes — aún puedes explorar "
            "los listados de comida, gestionar tu perfil y revisar "
            "tu horario directamente en la aplicación. ¡Volveré pronto!"
        ),
        "general_error": (
            "Algo salió mal de mi lado. Por favor, inténtalo de nuevo "
            "o usa la navegación de la aplicación para encontrar lo que "
            "necesitas. Si el problema persiste, contacta a soporte."
        ),
        "tool_error": (
            "No pude buscar esa información en este momento, "
            "pero aún puedo ayudarte con preguntas generales. "
            "También puedes revisar la aplicación directamente "
            "para los datos más recientes."
        ),
    },
}


def get_canned_response(error_type: str, lang: str = "en") -> str:
    """Return a canned fallback response for the given error type and language."""
    lang_key = "es" if lang == "es" else "en"
    return CANNED_RESPONSES.get(lang_key, CANNED_RESPONSES["en"]).get(
        error_type, CANNED_RESPONSES[lang_key]["general_error"]
    )
RATE_LIMIT_DEFAULT = 50
RATE_LIMIT_WINDOW = 60

# Supabase (service role for server-side operations)
# Read backend-specific env var first, fall back to VITE_ for backward compat
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

TRAINING_DATA_PATH = os.path.join(os.path.dirname(__file__), "ai_training_data.json")

# ---------------------------------------------------------------------------
# Rate limiter (in-memory, per-IP)
# ---------------------------------------------------------------------------

_rate_store: dict[str, list[float]] = {}


def check_rate_limit(client_ip: str, limit: int = RATE_LIMIT_DEFAULT) -> bool:
    """Return True if request is allowed, raise on limit breach."""
    now = time.time()
    timestamps = _rate_store.setdefault(client_ip, [])
    _rate_store[client_ip] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_store[client_ip]) >= limit:
        return False
    _rate_store[client_ip].append(now)
    return True


# ---------------------------------------------------------------------------
# Circuit breaker
# ---------------------------------------------------------------------------

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        reset_timeout: float = 60.0,
    ):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: float = 0

    def record_success(self) -> None:
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def record_failure(self) -> None:
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

    def allow_request(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time >= self.reset_timeout:
                self.state = CircuitState.HALF_OPEN
                return True
            return False
        # HALF_OPEN — allow one probe request
        return True


_circuit = CircuitBreaker()

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ChatMessage:
    """Lightweight message container (Pydantic models live in app.py)."""
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content}


# ---------------------------------------------------------------------------
# HTTP helpers — call external AI API with retry + circuit breaker
# ---------------------------------------------------------------------------

async def _ai_request(
    endpoint: str,
    payload: dict,
    *,
    base_url: str | None = None,
    api_key: str | None = None,
    retries: int = MAX_RETRIES,
) -> dict:
    """Make an HTTP request to an AI API with retries and circuit breaker."""
    import asyncio

    effective_key = api_key or OPENAI_API_KEY
    effective_base = base_url or OPENAI_BASE_URL

    if not effective_key:
        raise RuntimeError("AI API key is not configured")

    if not _circuit.allow_request():
        raise RuntimeError("AI service temporarily unavailable (circuit open)")

    headers = {
        "Authorization": f"Bearer {effective_key}",
        "Content-Type": "application/json",
    }

    last_exc: Exception | None = None
    for attempt in range(retries):
        try:
            client = _get_http_client(TIMEOUT_SECONDS)
            resp = await client.post(
                f"{effective_base}{endpoint}",
                json=payload,
                headers=headers,
            )
            if resp.status_code == 429:
                wait = 2**attempt + 1
                logger.warning("Rate‑limited by upstream, retrying in %ds", wait)
                await asyncio.sleep(wait)
                continue
            resp.raise_for_status()
            _circuit.record_success()
            return resp.json()
        except httpx.HTTPStatusError as exc:
            last_exc = exc
            logger.error("AI API error %s: %s", exc.response.status_code, exc.response.text[:300])
            _circuit.record_failure()
            if exc.response.status_code in (401, 403):
                raise RuntimeError("AI authentication failed") from exc
        except httpx.TimeoutException as exc:
            last_exc = exc
            logger.warning("AI API timeout (attempt %d/%d)", attempt + 1, retries)
            _circuit.record_failure()
        except httpx.RequestError as exc:
            last_exc = exc
            logger.warning("AI API request error: %s", exc)
            _circuit.record_failure()

        if attempt < retries - 1:
            await asyncio.sleep(2**attempt)

    raise RuntimeError(f"AI request failed after {retries} attempts: {last_exc}")


async def _openai_with_retry(
    method: str,
    url: str,
    *,
    headers: dict,
    json_payload: dict | None = None,
    files: dict | None = None,
    data: dict | None = None,
    timeout: float = TIMEOUT_SECONDS,
    retries: int = MAX_RETRIES,
) -> httpx.Response:
    """Fire an HTTP request to OpenAI with automatic retry + exponential backoff.

    Retries on 429 (rate-limit), 500/502/503 (server errors), and timeouts.
    Non-retryable errors (401, 403, 404, 422) are raised immediately.
    """
    import asyncio

    NON_RETRYABLE = {401, 403, 404, 422}
    last_exc: Exception | None = None

    for attempt in range(retries):
        try:
            client = _get_http_client(timeout)
            kwargs: dict = {"headers": headers}
            if json_payload is not None:
                kwargs["json"] = json_payload
            if files is not None:
                kwargs["files"] = files
            if data is not None:
                kwargs["data"] = data

            resp = await client.request(method, url, **kwargs)

            if resp.status_code == 429:
                wait = min(2 ** attempt + 1, 10)
                logger.warning(
                    "OpenAI 429 rate-limited (attempt %d/%d), retrying in %ds",
                    attempt + 1, retries, wait,
                )
                _circuit.record_failure()
                await asyncio.sleep(wait)
                continue

            if resp.status_code in NON_RETRYABLE:
                resp.raise_for_status()

            if resp.status_code >= 500:
                wait = min(2 ** attempt + 1, 10)
                logger.warning(
                    "OpenAI %d server error (attempt %d/%d), retrying in %ds",
                    resp.status_code, attempt + 1, retries, wait,
                )
                _circuit.record_failure()
                await asyncio.sleep(wait)
                continue

            resp.raise_for_status()
            _circuit.record_success()
            return resp

        except httpx.HTTPStatusError:
            raise
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            last_exc = exc
            _circuit.record_failure()
            if attempt < retries - 1:
                wait = min(2 ** attempt + 1, 10)
                logger.warning(
                    "OpenAI request error (attempt %d/%d): %s — retrying in %ds",
                    attempt + 1, retries, exc, wait,
                )
                await asyncio.sleep(wait)
            else:
                logger.error("OpenAI request failed after %d attempts: %s", retries, exc)

    raise RuntimeError(
        f"OpenAI request failed after {retries} attempts: {last_exc}"
    )


def _extract_content(response: dict) -> str:
    try:
        return response["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise RuntimeError("Unexpected AI response format") from exc


# ---------------------------------------------------------------------------
# Supabase REST helpers (service-role, server-side only)
# ---------------------------------------------------------------------------

def _supabase_headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def supabase_get(table: str, params: dict) -> list:
    """GET rows from a Supabase table via PostgREST."""
    client = _get_http_client(SUPABASE_TIMEOUT)
    resp = await client.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        params=params,
        headers=_supabase_headers(),
    )
    resp.raise_for_status()
    return resp.json()


async def supabase_post(
    table: str, data: dict | list | None, *, method: str = "POST"
) -> list:
    """INSERT/UPDATE/DELETE row(s) in a Supabase table via PostgREST."""
    client = _get_http_client(SUPABASE_TIMEOUT)
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = _supabase_headers()

    if method.upper() == "DELETE":
        resp = await client.delete(url, headers=headers)
    elif method.upper() == "PATCH":
        resp = await client.patch(url, json=data, headers=headers)
    else:
        resp = await client.post(url, json=data, headers=headers)

    resp.raise_for_status()
    try:
        result = resp.json()
        return result if isinstance(result, list) else [result]
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Training data loader
# ---------------------------------------------------------------------------

def _load_training_data() -> dict:
    try:
        with open(TRAINING_DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning("Training data not found: %s", TRAINING_DATA_PATH)
        return {}


def _build_system_prompt(training_data: dict) -> str:
    """Assemble a system prompt from training data sections."""
    sections: list[str] = []

    if "platform_overview" in training_data:
        sections.append(f"## Platform Overview\n{training_data['platform_overview']}")

    if "user_roles" in training_data:
        roles = "\n".join(
            f"- **{r['role']}**: {r['description']}"
            for r in training_data["user_roles"]
        )
        sections.append(f"## User Roles\n{roles}")

    if "processes" in training_data:
        procs = "\n".join(f"- {p}" for p in training_data["processes"])
        sections.append(f"## Key Processes\n{procs}")

    if "ai_capabilities" in training_data:
        caps = "\n".join(
            f"- **{c['capability']}**: {c['description']}"
            + (f" (Tool: `{c['tool']}`)" if "tool" in c else "")
            for c in training_data["ai_capabilities"]
        )
        sections.append(f"## Your Capabilities & Tools\n{caps}")

    if "navigation" in training_data:
        nav = training_data["navigation"]
        pages = []
        for label, page_map in [("Public Pages", "public_pages"), ("Pages Requiring Login", "protected_pages")]:
            if page_map in nav:
                page_list = "\n".join(f"  - `{route}`: {desc}" for route, desc in nav[page_map].items())
                pages.append(f"**{label}**:\n{page_list}")
        if pages:
            sections.append(f"## Platform Navigation\n" + "\n".join(pages))

    if "food_safety" in training_data:
        safety = "\n".join(f"- {s}" for s in training_data["food_safety"])
        sections.append(f"## Food Safety Guidelines\n{safety}")

    if "tone_guidelines" in training_data:
        sections.append(f"## Communication Style\n{training_data['tone_guidelines']}")

    if "spanish_guidelines" in training_data:
        sections.append(
            f"## Spanish Response Guidelines\n{training_data['spanish_guidelines']}"
        )

    if "common_questions" in training_data:
        qa = "\n".join(
            f"- **{key}**: {answer}"
            for key, answer in training_data["common_questions"].items()
        )
        sections.append(f"## Common Questions & Answers\n{qa}")

    if "response_examples" in training_data:
        examples = "\n".join(
            f"- **{key}**: {template}"
            for key, template in training_data["response_examples"].items()
        )
        sections.append(f"## Response Templates\n{examples}")

    base = training_data.get(
        "system_base",
        "You are DoGoods AI Assistant, a warm and helpful community food sharing assistant.",
    )

    # Inject current date/time so the model can reason about "tomorrow", "next week", etc.
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    return f"{base}\n\nCurrent date and time: {now_str}\n\n" + "\n\n".join(sections)


# ---------------------------------------------------------------------------
# Conversation Engine
# ---------------------------------------------------------------------------

class ConversationEngine:
    """
    Manages AI conversations:
      user message + user_id -> profile lookup -> GPT-4o query -> text/audio response
    """

    def __init__(self) -> None:
        self.training_data = _load_training_data()

        # Import tool definitions (lazy to avoid circular imports)
        from backend.tools import TOOL_DEFINITIONS, execute_tool

        self.tool_definitions = TOOL_DEFINITIONS
        self._execute_tool = execute_tool

    @property
    def system_prompt(self) -> str:
        """Rebuild system prompt each time so the datetime stays current."""
        return _build_system_prompt(self.training_data)

    # ---- Language detection -----------------------------------------------

    def _detect_lang(self, text: str) -> str:
        """Return 'es' for Spanish, 'en' for English."""
        return "es" if detect_spanish(text) else "en"

    # ---- Profile lookup ---------------------------------------------------

    async def get_user_profile(self, user_id: str) -> Optional[dict]:
        """Fetch user profile from Supabase users table."""
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            logger.warning("Supabase not configured — skipping profile lookup")
            return None
        try:
            rows = await supabase_get("users", {
                "id": f"eq.{user_id}",
                "select": "id,name,email,is_admin,avatar_url,organization,created_at",
            })
            return rows[0] if rows else None
        except Exception as exc:
            logger.error("Profile lookup failed for %s: %s", user_id, exc)
            return None

    # ---- Conversation history ---------------------------------------------

    async def get_conversation_history(
        self, user_id: str, limit: int = 50
    ) -> list[dict]:
        """Retrieve recent conversation messages from ai_conversations table."""
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            return []
        try:
            rows = await supabase_get("ai_conversations", {
                "user_id": f"eq.{user_id}",
                "select": "role,message,created_at",
                "order": "created_at.desc",
                "limit": str(limit),
            })
            rows.reverse()  # chronological order
            return rows
        except Exception as exc:
            logger.error("History fetch failed for %s: %s", user_id, exc)
            return []

    # ---- Store messages ---------------------------------------------------

    async def store_message(
        self,
        user_id: str,
        role: str,
        message: str,
        metadata: dict | None = None,
    ) -> str | None:
        """Persist a conversation message to ai_conversations table.
        Returns the inserted row's UUID, or None on failure."""
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            return None
        try:
            headers = _supabase_headers()
            headers["Prefer"] = "return=representation"
            async with httpx.AsyncClient(timeout=SUPABASE_TIMEOUT) as client:
                resp = await client.post(
                    f"{SUPABASE_URL}/rest/v1/ai_conversations",
                    json={
                        "user_id": user_id,
                        "role": role,
                        "message": message,
                        "metadata": metadata or {},
                    },
                    headers=headers,
                )
                if resp.status_code == 409:
                    # FK violation (user not in users table) — non-critical
                    logger.debug("Skipped storing message (user %s not in users table)", user_id)
                    return None
                resp.raise_for_status()
                rows = resp.json()
                if rows and isinstance(rows, list):
                    return rows[0].get("id")
                return None
        except Exception as exc:
            logger.error("Failed to store message: %s", exc)
            return None

    # ---- Main chat flow ---------------------------------------------------

    async def chat(
        self,
        user_id: str,
        message: str,
        include_audio: bool = False,
    ) -> dict:
        """
        Full conversation flow:
          1. Detect language (Spanish / English)
          2. Look up user profile
          3. Fetch conversation history
          4. Build messages with system prompt + context + history + new message
          5. Call GPT-4o with tool definitions (with fallback)
          6. Store user + assistant messages
          7. Optionally generate TTS audio (language-aware voice)
          8. Return text + audio URL + detected language
        """
        # 1. Language detection
        lang = self._detect_lang(message)

        # 2 & 3. Profile + History in parallel (graceful — failures don't block)
        profile_task = asyncio.create_task(self.get_user_profile(user_id))
        history_task = asyncio.create_task(self.get_conversation_history(user_id, limit=4))
        profile, history = await asyncio.gather(profile_task, history_task)

        # 4. Build messages
        messages: list[dict] = [{"role": "system", "content": self.system_prompt}]

        # Inject language directive
        if lang == "es":
            messages.append({
                "role": "system",
                "content": (
                    "The user is writing in Spanish. You MUST respond entirely "
                    "in Spanish. Maintain your warm, helpful personality. "
                    "Use 'tú' for casual and 'usted' for formal contexts."
                ),
            })

        if profile:
            context = (
                f"Current user: {profile.get('name', 'Community Member')} "
                f"(ID: {user_id}). "
                f"Organization: {profile.get('organization', 'N/A')}. "
                f"Role: {'Admin' if profile.get('is_admin') else 'Member'}. "
                f"When calling tools that require user_id, always use \"{user_id}\"."
            )
            messages.append({"role": "system", "content": context})
        else:
            # No profile found, still provide user_id for tool calls
            context = (
                f"Current user ID: {user_id}. "
                f"When calling tools that require user_id, always use \"{user_id}\"."
            )
            messages.append({"role": "system", "content": context})

        for msg in history:
            # Truncate long history messages to avoid bloating the context
            content = msg["message"]
            if len(content) > 400:
                content = content[:400] + "... [truncated]"
            messages.append({"role": msg["role"], "content": content})

        messages.append({"role": "user", "content": message})

        # 5. Call GPT-4o with full fallback chain
        response_text = await self._call_with_fallbacks(messages, lang)

        # 6. Persist conversation (await to get row ID for feedback)
        conversation_id = await self._persist_conversation(
            user_id, message, response_text, lang
        )

        # 7. Optional audio (language-aware voice selection)
        audio_url = None
        if include_audio:
            audio_url = await self._generate_audio_url(response_text, lang=lang)

        return {
            "text": response_text,
            "audio_url": audio_url,
            "user_id": user_id,
            "lang": lang,
            "conversation_id": conversation_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def _persist_conversation(
        self, user_id: str, user_msg: str, assistant_msg: str, lang: str
    ) -> str | None:
        """Store both user and assistant messages in parallel. Returns assistant row UUID."""
        try:
            _, row_id = await asyncio.gather(
                self.store_message(user_id, "user", user_msg),
                self.store_message(
                    user_id, "assistant", assistant_msg,
                    metadata={"lang": lang},
                ),
            )
            return row_id
        except Exception as exc:
            logger.error("Conversation persistence failed: %s", exc)
            return None

    # ---- Fallback-aware orchestrator --------------------------------------

    async def _call_with_fallbacks(
        self, messages: list[dict], lang: str = "en"
    ) -> str:
        """Try GPT-4o; on failure fall back to text-only canned responses."""
        # Attempt 1: Full GPT-4o with tool calling
        try:
            return await self._call_openai_chat(messages, lang=lang)
        except httpx.TimeoutException:
            logger.warning("GPT-4o timed out — returning canned timeout response")
            return get_canned_response("timeout", lang)
        except httpx.HTTPStatusError as exc:
            logger.error("GPT-4o HTTP error %s", exc.response.status_code)
            return get_canned_response("api_down", lang)
        except RuntimeError as exc:
            # e.g. "OPENAI_API_KEY not configured"
            logger.error("GPT-4o runtime error: %s", exc)
            return get_canned_response("api_down", lang)
        except Exception as exc:
            logger.error("GPT-4o unexpected error: %s", exc)
            return get_canned_response("general_error", lang)

    # ---- Lightweight tool-need classifier ---------------------------------

    @staticmethod
    def _needs_tools(message: str) -> bool:
        """Quick heuristic: does the user message likely need a tool call?

        Tool-requiring messages reference personal data (dashboard, profile,
        pickups, claims, notifications, reminders, nearby food, directions,
        communities, distribution centers).
        Generic chat (greetings, recipes, storage tips, food safety, how-to)
        can be answered from the system prompt alone — skip tools for speed.
        """
        lower = message.lower()
        # Keywords that signal a database/tool lookup is needed
        tool_keywords = {
            "dashboard", "profile", "my account", "my info",
            "pickup", "schedule", "claim", "claimed",
            "notification", "notifications", "unread",
            "remind", "reminder", "set a reminder",
            "near me", "nearby", "find food", "available food",
            "search food", "food near", "listings near",
            "direction", "directions", "route", "how do i get",
            "distribution", "community", "communities",
            "my listings", "my food", "my impact",
            "mark", "read",
        }
        return any(kw in lower for kw in tool_keywords)

    # ---- OpenAI chat completions with tool calling -----------------------

    async def _call_openai_chat(
        self, messages: list[dict], lang: str = "en"
    ) -> str:
        """Call GPT-4o, handle tool calls, return final assistant text."""
        import time as _time
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY not configured")

        # Only include tool definitions when the message likely needs them
        # This avoids the ~16s overhead of sending 14 tool schemas for simple chat
        user_text = ""
        for m in reversed(messages):
            if m["role"] == "user":
                user_text = m.get("content", "")
                break
        use_tools = self._needs_tools(user_text)

        payload = {
            "model": CHAT_MODEL,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1024,
        }
        if use_tools:
            payload["tools"] = self.tool_definitions

        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }

        t0 = _time.time()
        resp = await _openai_with_retry(
            "POST",
            f"{OPENAI_BASE_URL}/chat/completions",
            headers=headers,
            json_payload=payload,
        )
        t1 = _time.time()
        logger.info("GPT initial call: %.1fs", t1 - t0)
        data = resp.json()

        choice = data["choices"][0]
        msg = choice["message"]

        # Handle tool calls (single round) with graceful per-tool errors
        if msg.get("tool_calls"):
            # Work on a copy to avoid mutating the caller's message list
            tool_messages = list(messages)
            tool_messages.append(msg)
            for tool_call in msg["tool_calls"]:
                fn_name = tool_call["function"]["name"]
                try:
                    fn_args = json.loads(tool_call["function"]["arguments"])
                except (json.JSONDecodeError, TypeError) as parse_err:
                    logger.error("Bad tool args for %s: %s", fn_name, parse_err)
                    tool_messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "content": json.dumps({"error": f"Invalid arguments: {parse_err}"}),
                    })
                    continue

                try:
                    t_tool = _time.time()
                    result = await self._execute_tool(fn_name, fn_args)
                    logger.info("Tool %s executed: %.1fs", fn_name, _time.time() - t_tool)
                except Exception as tool_exc:
                    logger.error("Tool %s failed: %s", fn_name, tool_exc)
                    # Graceful tool error — feed error context back to GPT
                    result = {
                        "error": True,
                        "message": (
                            f"The {fn_name} tool encountered an error. "
                            "Please respond helpfully without this data."
                        ),
                    }

                # Truncate large tool results to avoid blowing token limits
                result_str = json.dumps(result)
                if len(result_str) > 4000:
                    result_str = result_str[:4000] + '... [truncated]"}}'

                tool_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "content": result_str,
                })

            # Follow-up call with tool results — use faster model since it's just formatting
            followup_payload = {
                "model": FOLLOWUP_MODEL,
                "messages": tool_messages,
                "temperature": 0.7,
                "max_tokens": 1024,
            }
            try:
                t2 = _time.time()
                resp = await _openai_with_retry(
                    "POST",
                    f"{OPENAI_BASE_URL}/chat/completions",
                    headers=headers,
                    json_payload=followup_payload,
                )
                t3 = _time.time()
                logger.info("GPT follow-up call: %.1fs (total: %.1fs)", t3 - t2, t3 - t0)
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            except Exception as followup_exc:
                logger.error("GPT-4o follow-up failed: %s", followup_exc)
                return get_canned_response("tool_error", lang)

        return msg["content"]

    # ---- Whisper speech-to-text ------------------------------------------

    async def transcribe_audio(
        self, audio_bytes: bytes, filename: str = "audio.webm"
    ) -> str:
        """Transcribe audio using OpenAI Whisper API.

        Whisper auto-detects language (supports Spanish natively).
        Raises RuntimeError on config issues, httpx errors on API failure.
        """
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY not configured")

        headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}

        resp = await _openai_with_retry(
            "POST",
            f"{OPENAI_BASE_URL}/audio/transcriptions",
            headers=headers,
            files={"file": (filename, audio_bytes)},
            data={"model": WHISPER_MODEL, "response_format": "json"},
            timeout=60,
        )
        return resp.json()["text"]

    # ---- TTS text-to-speech ----------------------------------------------

    async def generate_speech(self, text: str, lang: str = "en") -> bytes:
        """Generate speech audio bytes using OpenAI TTS API.

        Selects voice based on language: Spanish uses TTS_VOICE_ES,
        English uses TTS_VOICE_EN (both support Sesame voices).
        """
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY not configured")

        # TTS has a ~4096 char limit
        truncated = text[:4096]
        voice = TTS_VOICE_ES if lang == "es" else TTS_VOICE_EN

        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }

        resp = await _openai_with_retry(
            "POST",
            f"{OPENAI_BASE_URL}/audio/speech",
            headers=headers,
            json_payload={
                "model": TTS_MODEL,
                "input": truncated,
                "voice": voice,
            },
            timeout=30,
        )
        return resp.content

    async def _generate_audio_url(
        self, text: str, lang: str = "en"
    ) -> Optional[str]:
        """Generate speech and upload to Supabase storage, return public URL."""
        try:
            audio_bytes = await self.generate_speech(text, lang=lang)
            ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
            filename = f"ai-voice/{ts}-response.mp3"

            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "audio/mpeg",
            }
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"{SUPABASE_URL}/storage/v1/object/ai-audio/{filename}",
                    content=audio_bytes,
                    headers=headers,
                )
                if resp.status_code in (200, 201):
                    return (
                        f"{SUPABASE_URL}/storage/v1/object/public/"
                        f"ai-audio/{filename}"
                    )
            logger.warning("Audio upload failed: HTTP %s", resp.status_code)
            return None
        except Exception as exc:
            logger.warning("Audio generation failed: %s", exc)
            return None


# ---------------------------------------------------------------------------
# Singleton instances
# ---------------------------------------------------------------------------

conversation_engine = ConversationEngine()


# ---------------------------------------------------------------------------
# Legacy helpers used by app.py routes (matching, recipes, etc.)
# ---------------------------------------------------------------------------

async def legacy_ai_request(endpoint: str, payload: dict) -> dict:
    """Call OpenAI for legacy routes (recipes, storage tips, etc.)."""
    return await _ai_request(endpoint, payload)
