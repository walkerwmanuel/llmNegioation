import { useCallback } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";

interface DownloadChatButtonProps {
  transcript: string;        // Full text transcript to export
  filename?: string;         // Optional filename
}

export default function DownloadChatButton({
  transcript,
  filename = "negotiation_transcript.docx",
}: DownloadChatButtonProps) {
  const handleDownload = useCallback(async () => {
    const clean = transcript.trim();
    if (!clean) {
      console.error("No transcript to export");
      return;
    }

    // Build paragraphs (with a title and basic formatting)
    const paragraphs: Paragraph[] = [];

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Bot–Bot Negotiation Transcript",
            bold: true,
            size: 28,
          }),
        ],
      }),
      new Paragraph({}) // blank line
    );

    const lines = clean.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, "");

      // Style round headers a bit
      if (/^=== Round \d+ ===$/.test(line.trim())) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line.trim(), bold: true })],
          }),
          new Paragraph({})
        );
      } else {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line })],
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }, [transcript, filename]);

  return (
    <button
      onClick={handleDownload}
      style={{
        background: "#4a90e2",
        color: "white",
        border: "none",
        borderRadius: "6px",
        padding: "10px 16px",
        cursor: "pointer",
        marginTop: "12px",
      }}
    >
      Download Chat (.docx)
    </button>
  );
}

