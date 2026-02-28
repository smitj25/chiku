"""
LLM Service — Unified interface to Gemini and Groq.
Constructs augmented prompts with retrieved context and citations format.
"""
from __future__ import annotations
import time
from typing import Optional

from config import (
    GEMINI_API_KEY, GROQ_API_KEY,
    LLM_PROVIDER, GEMINI_MODEL, GROQ_MODEL,
)
from services.document_store import Section


class LLMService:
    """Unified LLM interface supporting Gemini and Groq."""

    def __init__(self):
        self._gemini_model = None
        self._groq_client = None

    def _init_gemini(self):
        if self._gemini_model is None:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            self._gemini_model = genai.GenerativeModel(GEMINI_MODEL)

    def _init_groq(self):
        if self._groq_client is None:
            from groq import Groq
            self._groq_client = Groq(api_key=GROQ_API_KEY)

    def generate(
        self,
        query: str,
        context_sections: list[Section],
        system_prompt: str,
        provider: Optional[str] = None,
    ) -> tuple[str, float]:
        """
        Generate a response using the specified LLM provider.
        Returns (response_text, duration_ms).
        """
        provider = provider or LLM_PROVIDER

        # Build the augmented prompt
        augmented_prompt = self._build_prompt(query, context_sections, system_prompt)

        start = time.time()

        if provider == "gemini":
            response = self._call_gemini(augmented_prompt, system_prompt)
        elif provider == "groq":
            response = self._call_groq(augmented_prompt, system_prompt)
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")

        duration_ms = (time.time() - start) * 1000
        return response, duration_ms

    def generate_vanilla(self, query: str) -> tuple[str, float]:
        """
        Generate a response WITHOUT RAG context or guardrails.
        Used for the comparison mode to show how a vanilla LLM fails.
        """
        vanilla_prompt = (
            "Answer the following question. Be helpful and informative.\n\n"
            f"Question: {query}"
        )

        start = time.time()

        provider = LLM_PROVIDER
        if provider == "gemini":
            self._init_gemini()
            result = self._gemini_model.generate_content(vanilla_prompt)
            response = result.text
        elif provider == "groq":
            self._init_groq()
            result = self._groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": vanilla_prompt}],
                temperature=0.7,
                max_tokens=1024,
            )
            response = result.choices[0].message.content
        else:
            response = "Error: Unknown LLM provider"

        duration_ms = (time.time() - start) * 1000
        return response, duration_ms

    def _build_prompt(self, query: str, sections: list[Section], system_prompt: str) -> str:
        """Build the augmented prompt with retrieved context."""
        context_parts = []
        for i, section in enumerate(sections, 1):
            context_parts.append(
                f"--- Document {i} ---\n"
                f"File: {section.filename}\n"
                f"Page: {section.page}\n"
                f"Section: {section.title}\n"
                f"Content:\n{section.content}\n"
            )

        context_block = "\n".join(context_parts) if context_parts else "No relevant documents found."

        return (
            f"RETRIEVED DOCUMENTS:\n"
            f"{'='*60}\n"
            f"{context_block}\n"
            f"{'='*60}\n\n"
            f"IMPORTANT INSTRUCTIONS:\n"
            f"1. ONLY use information from the RETRIEVED DOCUMENTS above.\n"
            f"2. For EVERY factual claim, include a citation: [Source: filename, Page X, Section Y]\n"
            f"3. If the documents do not contain the answer, clearly state: "
            f"\"The provided documents do not contain information about this topic.\"\n"
            f"4. NEVER make up information not present in the documents.\n"
            f"5. Be precise and specific — cite exact page numbers and sections.\n\n"
            f"USER QUESTION: {query}"
        )

    def _call_gemini(self, prompt: str, system_prompt: str) -> str:
        self._init_gemini()
        full_prompt = f"{system_prompt}\n\n{prompt}"
        result = self._gemini_model.generate_content(full_prompt)
        return result.text

    def _call_groq(self, prompt: str, system_prompt: str) -> str:
        self._init_groq()
        result = self._groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,  # Low temperature for deterministic, factual responses
            max_tokens=2048,
        )
        return result.choices[0].message.content


# Singleton
llm_service = LLMService()
