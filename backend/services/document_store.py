"""
Document Store — Loads corpus documents, builds section indices, 
and provides retrieval by keyword/section matching.
This is a simplified PageIndex-style retriever that uses document structure
(sections, pages) for retrieval instead of vector embeddings.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field


@dataclass
class Section:
    """A retrievable section of a document."""
    filename: str
    title: str
    page: int
    content: str
    node_id: str  # Unique section identifier
    subsections: list[Section] = field(default_factory=list)


@dataclass
class RetrievedSection:
    """A section returned from retrieval with a relevance score."""
    section: Section
    score: float
    match_type: str  # "exact", "fuzzy", "keyword"


class DocumentStore:
    """
    Structural document store that parses section-based documents
    and retrieves relevant sections via keyword + structural matching.
    Simulates PageIndex's reasoning-based retrieval for the MVP.
    """

    def __init__(self):
        self._documents: dict[str, list[Section]] = {}

    def load_document(self, filename: str, text: str):
        """Parse a structured text document into sections."""
        sections = self._parse_sections(filename, text)
        self._documents[filename] = sections

    def load_corpus(self, corpus_texts: dict[str, str]):
        """Load multiple documents at once."""
        for filename, text in corpus_texts.items():
            self.load_document(filename, text)

    def retrieve(self, query: str, top_k: int = 5) -> list[RetrievedSection]:
        """
        Retrieve relevant sections across all loaded documents.
        Uses structural matching + keyword scoring.
        """
        query_lower = query.lower()
        query_terms = set(re.findall(r'\b\w+\b', query_lower))
        results: list[RetrievedSection] = []

        for filename, sections in self._documents.items():
            for section in sections:
                score = self._score_section(section, query_lower, query_terms)
                if score > 0:
                    results.append(RetrievedSection(
                        section=section,
                        score=score,
                        match_type=self._classify_match(score),
                    ))

        # Sort by score descending
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:top_k]

    def _score_section(self, section: Section, query_lower: str, query_terms: set[str]) -> float:
        """Score a section's relevance to a query."""
        content_lower = section.content.lower()
        title_lower = section.title.lower()
        score = 0.0

        # Exact phrase match — highest signal
        if query_lower in content_lower:
            score += 10.0

        # Name matching (for sanctions screening)
        # Extract potential names from query (capitalized words)
        name_pattern = re.findall(r'[A-Z][a-z]+', query_lower.title())
        for name in name_pattern:
            if name.lower() in content_lower:
                score += 8.0

        # Title match
        title_terms = set(re.findall(r'\b\w+\b', title_lower))
        title_overlap = query_terms & title_terms
        score += len(title_overlap) * 3.0

        # Keyword overlap
        content_terms = set(re.findall(r'\b\w+\b', content_lower))
        keyword_overlap = query_terms & content_terms
        # Deweight stopwords
        stopwords = {"is", "on", "the", "a", "an", "for", "in", "of", "to", "and", "or", "what", "are", "this", "that", "with"}
        meaningful_overlap = keyword_overlap - stopwords
        score += len(meaningful_overlap) * 1.0

        # Boost for specific compliance/finance terms
        high_value_terms = {
            "ofac", "sdn", "sanctions", "screened", "screening", "aml",
            "compliance", "kyc", "pep", "designation", "blocked",
            "penalty", "penalties", "prohibited", "transaction",
            "mutual fund", "sip", "nav", "investment", "risk",
            "returns", "portfolio", "equity", "debt",
        }
        hv_overlap = query_terms & high_value_terms
        score += len(hv_overlap) * 2.0

        return score

    def _classify_match(self, score: float) -> str:
        if score >= 10.0:
            return "exact"
        elif score >= 5.0:
            return "fuzzy"
        return "keyword"

    def _parse_sections(self, filename: str, text: str) -> list[Section]:
        """Parse a structured text file into sections based on === headers and --- entries."""
        sections: list[Section] = []
        current_section: dict | None = None
        current_page = 1
        node_counter = 0
        lines = text.split("\n")

        for line in lines:
            # Page marker
            page_match = re.match(r'^Page\s+(\d+)', line.strip())
            if page_match:
                current_page = int(page_match.group(1))
                continue

            # Major section header: === SECTION X: TITLE ===
            section_match = re.match(r'^===\s*(.+?)\s*===$', line.strip())
            if section_match:
                if current_section:
                    sections.append(Section(
                        filename=filename,
                        title=current_section["title"],
                        page=current_section["page"],
                        content="\n".join(current_section["lines"]).strip(),
                        node_id=f"{filename}:{current_section['node_id']}",
                    ))
                node_counter += 1
                current_section = {
                    "title": section_match.group(1).strip(),
                    "page": current_page,
                    "lines": [],
                    "node_id": f"N{node_counter:04d}",
                }
                continue

            # Sub-entry header: --- Entry #XXXX ---
            entry_match = re.match(r'^---\s*(.+?)\s*---$', line.strip())
            if entry_match:
                # Save current section and start a new sub-section
                if current_section and current_section["lines"]:
                    sections.append(Section(
                        filename=filename,
                        title=current_section["title"],
                        page=current_section["page"],
                        content="\n".join(current_section["lines"]).strip(),
                        node_id=f"{filename}:{current_section['node_id']}",
                    ))
                node_counter += 1
                parent_title = current_section["title"] if current_section else "Unknown"
                current_section = {
                    "title": f"{parent_title} > {entry_match.group(1).strip()}",
                    "page": current_page,
                    "lines": [],
                    "node_id": f"N{node_counter:04d}",
                }
                continue

            # Chapter headers: === CHAPTER X: TITLE ===
            chapter_match = re.match(r'^===\s*(CHAPTER\s+.+?)\s*===$', line.strip())
            if chapter_match:
                if current_section:
                    sections.append(Section(
                        filename=filename,
                        title=current_section["title"],
                        page=current_section["page"],
                        content="\n".join(current_section["lines"]).strip(),
                        node_id=f"{filename}:{current_section['node_id']}",
                    ))
                node_counter += 1
                current_section = {
                    "title": chapter_match.group(1).strip(),
                    "page": current_page,
                    "lines": [],
                    "node_id": f"N{node_counter:04d}",
                }
                continue

            # Sub-section: 3.1.4 Title
            subsec_match = re.match(r'^(\d+\.\d+(?:\.\d+)?)\s+(.+)', line.strip())
            if subsec_match:
                if current_section and current_section["lines"]:
                    sections.append(Section(
                        filename=filename,
                        title=current_section["title"],
                        page=current_section["page"],
                        content="\n".join(current_section["lines"]).strip(),
                        node_id=f"{filename}:{current_section['node_id']}",
                    ))
                node_counter += 1
                current_section = {
                    "title": f"{subsec_match.group(1)} {subsec_match.group(2)}".strip(),
                    "page": current_page,
                    "lines": [],
                    "node_id": f"N{node_counter:04d}",
                }
                continue

            # Regular content line
            if current_section is not None:
                current_section["lines"].append(line)

        # Don't forget the last section
        if current_section and current_section["lines"]:
            sections.append(Section(
                filename=filename,
                title=current_section["title"],
                page=current_section["page"],
                content="\n".join(current_section["lines"]).strip(),
                node_id=f"{filename}:{current_section['node_id']}",
            ))

        return sections

    def get_all_sections(self) -> list[Section]:
        """Return all sections from all loaded documents."""
        all_sections = []
        for sections in self._documents.values():
            all_sections.extend(sections)
        return all_sections


# Singleton
document_store = DocumentStore()
