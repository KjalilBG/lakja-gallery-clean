import json
import re
import sys


def extract_candidates(text: str) -> list[str]:
    compact = re.sub(r"(\d)\s+(?=\d)", r"\1", text or "")
    compact = compact.replace("O", "0").replace("o", "0")
    compact = compact.replace("I", "1").replace("l", "1").replace("L", "1")
    values = re.findall(r"\b\d{2,6}\b", compact)
    seen: list[str] = []
    for value in values:
        normalized = re.sub(r"\D+", "", value).strip()
        if 2 <= len(normalized) <= 6 and normalized not in seen:
            seen.append(normalized)
    return seen[:10]


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Falta la ruta de imagen."}))
        return 1

    image_path = sys.argv[1]

    try:
        from paddleocr import PaddleOCR
    except Exception as error:
        print(
            json.dumps(
                {
                    "error": "PaddleOCR no esta instalado o no es compatible con este Python. "
                    "Instala paddleocr en un entorno compatible. "
                    f"Detalle: {error}"
                }
            )
        )
        return 1

    try:
        ocr = PaddleOCR(use_doc_orientation_classify=False, use_doc_unwarping=False, use_textline_orientation=False, lang="en")
        result = ocr.predict(input=image_path)

        texts: list[str] = []
        for item in result or []:
            rec_texts = getattr(item, "rec_texts", None)
            if rec_texts:
                texts.extend([str(text) for text in rec_texts if text])

        combined_text = "\n".join(texts).strip()
        print(
            json.dumps(
                {
                    "text": combined_text,
                    "candidates": extract_candidates(combined_text),
                }
            )
        )
        return 0
    except Exception as error:
        print(json.dumps({"error": f"PaddleOCR fallo: {error}"}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
