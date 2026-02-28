"""SME-Plug Python client."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import httpx

from .models import ChatResponse, Citation, EvalResponse, SMEPlugError, UploadResponse


class SMEPlug:
    """
    Official Python client for SME-Plug.

    Args:
        api_key: Your SME-Plug API key (sme_live_xxx or sme_test_xxx).
        plugin_id: Plugin to use (e.g. 'legal-v1', 'healthcare-v1').
        base_url: API base URL (default: https://api.smeplug.dev).
        timeout: Request timeout in seconds (default: 30).

    Example:
        >>> from smeplug import SMEPlug
        >>> plug = SMEPlug(api_key="sme_live_xxx", plugin_id="legal-v1")
        >>> response = plug.chat("What are the GDPR penalties?")
        >>> print(response.text)
        >>> print(response.citations)
    """

    def __init__(
        self,
        api_key: str,
        plugin_id: str,
        base_url: str = "https://api.smeplug.dev",
        timeout: float = 30.0,
    ):
        if not api_key:
            raise ValueError("api_key is required")
        if not plugin_id:
            raise ValueError("plugin_id is required")

        self._api_key = api_key
        self._plugin_id = plugin_id
        self._base_url = base_url.rstrip("/")
        self._session_id: Optional[str] = None
        self._client = httpx.Client(
            base_url=self._base_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )

    def chat(self, message: str, *, session_id: Optional[str] = None) -> ChatResponse:
        """
        Send a chat message to your SME plugin.

        Args:
            message: The question or prompt.
            session_id: Optional session ID for follow-up messages.

        Returns:
            ChatResponse with text, citations, verified flag, and RAGAS score.

        Raises:
            SMEPlugError: If the API returns an error.

        Example:
            >>> res = plug.chat("Analyze clause 4.2 for liability.")
            >>> print(res.text)        # Cited analysis
            >>> print(res.citations)   # [Citation(source="contract.pdf", page=12)]
            >>> print(res.verified)    # True
            >>> print(res.ragas_score) # 0.93
        """
        sid = session_id or self._session_id

        response = self._request(
            "POST",
            "/v1/chat",
            json={
                "message": message,
                "plugin_id": self._plugin_id,
                "session_id": sid,
            },
        )

        result = ChatResponse.model_validate(response)
        self._session_id = result.session_id
        return result

    def upload(self, file_path: str | Path) -> UploadResponse:
        """
        Upload a document to the plugin's knowledge base.

        Args:
            file_path: Path to the file to upload (PDF, DOCX, TXT, etc.).

        Returns:
            UploadResponse with document_id and processing status.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")

        with open(path, "rb") as f:
            response = self._client.post(
                "/v1/upload",
                files={"file": (path.name, f)},
                data={"plugin_id": self._plugin_id},
            )

        self._check_response(response)
        return UploadResponse.model_validate(response.json())

    def reindex(self) -> dict:
        """Trigger a re-index of the plugin's knowledge base."""
        return self._request("POST", f"/v1/reindex/{self._plugin_id}")

    def evaluate(self) -> EvalResponse:
        """
        Get RAGAS evaluation scores for this plugin.

        Returns:
            EvalResponse with faithfulness, answer_relevancy, context_precision, overall.
        """
        data = self._request("GET", f"/v1/eval/{self._plugin_id}")
        return EvalResponse.model_validate(data)

    def clear_session(self) -> None:
        """Clear the current session (starts a new conversation)."""
        self._session_id = None

    @property
    def session_id(self) -> Optional[str]:
        """Current session ID."""
        return self._session_id

    @property
    def plugin_id(self) -> str:
        """Active plugin ID."""
        return self._plugin_id

    def _request(self, method: str, path: str, **kwargs) -> dict:
        """Make an HTTP request and return JSON response."""
        response = self._client.request(method, path, **kwargs)
        self._check_response(response)
        return response.json()

    @staticmethod
    def _check_response(response: httpx.Response) -> None:
        """Check response status and raise appropriate errors."""
        if response.is_success:
            return

        if response.status_code == 401:
            raise SMEPlugError(
                "Invalid API key. Check your key at smeplug.dev/api-keys",
                code="INVALID_KEY",
                status=401,
            )
        if response.status_code == 429:
            raise SMEPlugError(
                "Rate limit exceeded. Upgrade your plan at smeplug.dev/billing",
                code="RATE_LIMITED",
                status=429,
            )

        body = response.text
        raise SMEPlugError(
            f"API error {response.status_code}: {body}",
            code="API_ERROR",
            status=response.status_code,
        )

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def __repr__(self) -> str:
        return f"SMEPlug(plugin_id={self._plugin_id!r})"
