import { useCallback, useMemo } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { Button } from "./Button";

interface DownloadChatButtonProps {
  transcript: string;
  filename?: string;  // if provided, overrides timestamp generation
}

export default function DownloadChatButton({
  transcript,
  filename,
}: DownloadChatButtonProps) {

  // Build timestamp-only filename if none provided
  const computedFilename = useMemo(() => {
    if (filename) return filename;

    const now = new Date();

    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const time = [
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("-");

    return `negotiation_${date}_${time}.docx`;
  }, [filename]);

  const handleDownload = useCallback(async () => {
    const clean = transcript.trim();
    if (!clean) {
      console.error("No transcript to export");
      return;
    }

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
      new Paragraph({})
    );

    const lines = clean.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, "");

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
    a.download = computedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }, [transcript, computedFilename]);

  return (
    <Button variant="default" size="md" onClick={handleDownload}>
      Download Chat (.docx)
    </Button>
  );
}