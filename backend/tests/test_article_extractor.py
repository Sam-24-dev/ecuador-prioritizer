from importlib import import_module
from pathlib import Path

import pytest

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "article_extractor"


def extract_fixture(name: str):
    module = import_module("app.services.article_extractor")
    return module.ArticleExtractor().extract_html((FIXTURE_DIR / name).read_bytes())


def test_extracts_clean_news_text_and_optional_metadata_from_downloaded_html() -> None:
    result = extract_fixture("normal_news.html")
    assert result.title == "Elecciones locales avanzan con normalidad"
    assert result.author == "Ana P\u00e9rez"
    assert result.published_at.isoformat() == "2026-08-20"
    assert "juntas receptoras del voto" in result.text
    assert "primeros resultados" in result.text
    assert "Suscr\u00edbete" not in result.text
    assert result.warnings == ()


def test_extracts_a_wordpress_article_without_navigation_or_sidebar() -> None:
    result = extract_fixture("wordpress_article.html")
    assert result.title == "Municipio inaugura nueva planta de agua"
    assert result.author == "Redacci\u00f3n Local"
    assert result.published_at.isoformat() == "2026-08-19"
    assert "planta que ampliar\u00e1 el suministro" in result.text
    assert "Entradas recientes" not in result.text


def test_removes_synthetic_boilerplate_from_article_text() -> None:
    result = extract_fixture("boilerplate.html")
    assert "reducci\u00f3n sostenida de part\u00edculas" in result.text
    assert "comunidades puedan verificar" in result.text
    assert "PUBLICIDAD" not in result.text
    assert "Iniciar sesi\u00f3n" not in result.text


def test_decodes_declared_latin1_html_before_extracting_text() -> None:
    result = extract_fixture("latin1_article.html")
    assert result.title == "Cr\u00f3nica de Guayaquil"
    assert result.author == "Jos\u00e9 Mu\u00f1oz"
    assert "m\u00fasica, caf\u00e9" in result.text


def test_returns_an_empty_preview_warning_when_html_has_no_article_content() -> None:
    result = extract_fixture("empty_article.html")
    assert result.text == ""
    assert result.warnings == ("No article text could be extracted.",)


def test_preserves_partial_paywall_text_with_a_quality_warning() -> None:
    result = extract_fixture("partial_paywall.html")
    assert "disponible para suscriptores" in result.text
    assert result.warnings == ("The article may be incomplete due to a paywall.",)


def test_returns_an_empty_preview_warning_for_javascript_dependent_html() -> None:
    result = extract_fixture("javascript_only.html")
    assert result.text == ""
    assert result.warnings == ("No article text could be extracted.",)


def test_extractor_never_uses_trafilatura_url_fetching(monkeypatch: pytest.MonkeyPatch) -> None:
    module = import_module("app.services.article_extractor")

    def unexpected_url_fetch(*_args, **_kwargs):
        raise AssertionError("URL fetching is outside Phase 4")

    monkeypatch.setattr(module.trafilatura, "fetch_url", unexpected_url_fetch)
    result = module.ArticleExtractor().extract_html((FIXTURE_DIR / "normal_news.html").read_bytes())
    assert "juntas receptoras del voto" in result.text
