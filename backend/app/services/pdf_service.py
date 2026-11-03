
import fitz
from pathlib import Path


class PDFProcessingError(Exception):
    """Custom exception for PDF processing failures."""
    pass


def extract_text_from_pdf(file_path: str) -> dict:
    """
    Extract text from all pages of a PDF.

    Returns:
        {
            "text": extracted text,
            "total_pages": number of pages,
            "filename": PDF filename
        }
    """

    path = Path(file_path)

    if not path.exists():
        raise PDFProcessingError("PDF file does not exist.")

    try:
        with fitz.open(str(path)) as document:

            if document.is_encrypted:
                raise PDFProcessingError(
                    "Password-protected PDFs are not supported."
                )

            if document.page_count == 0:
                raise PDFProcessingError("PDF contains no pages.")

            extracted_pages = []

            for page_number, page in enumerate(document, start=1):
                page_text = page.get_text("text")

                if page_text.strip():
                    extracted_pages.append(
                        f"\n--- Page {page_number} ---\n{page_text}"
                    )

            extracted_text = "\n".join(extracted_pages).strip()

            if not extracted_text:
                raise PDFProcessingError(
                    "No readable text found. "
                    "This may be a scanned PDF requiring OCR."
                )

            return {
                "text": extracted_text,
                "total_pages": document.page_count,
                "filename": path.name
            }

    except PDFProcessingError:
        raise

    except Exception as error:
        raise PDFProcessingError(
            f"Unable to process PDF: {str(error)}"
        ) from error
