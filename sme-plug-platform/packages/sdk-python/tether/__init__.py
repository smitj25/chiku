"""
Tether Python SDK

Official Python client for Tether — AI expert plugins with verified citations.

Usage:
    from tether import Tether

    plug = Tether(api_key="tether_live_xxx", plugin_id="legal-v1")
    response = plug.chat("What does clause 4.2 mean?")
    print(response.text)
    print(response.citations)
"""

from .client import Tether
from .models import ChatResponse, Citation, UploadResponse, EvalResponse, TetherError

__version__ = "0.1.0"
__all__ = [
    "Tether",
    "ChatResponse",
    "Citation",
    "UploadResponse",
    "EvalResponse",
    "TetherError",
]
