const BRAND_LOGO_PATH = "/assets/loginhemoranew2.svg";

function escapePdfText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function truncate(value, maxLength) {
  const text = String(value ?? "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-CA");
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value ?? "");

  const datePart = date.toLocaleDateString("en-CA");
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;

  return `${datePart}, ${hours}:${minutes} ${suffix}`;
}

function drawLine(x1, y1, x2, y2) {
  return `${x1} ${y1} m ${x2} ${y2} l S`;
}

function estimateTextWidth(text, fontSize) {
  return String(text ?? "").length * fontSize * 0.46;
}

function bytesToHex(binaryString) {
  let hex = "";
  for (let i = 0; i < binaryString.length; i += 1) {
    hex += binaryString
      .charCodeAt(i)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  }
  return `${hex}>`;
}

async function loadBrandLogo() {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Failed to create canvas context"));
        return;
      }

      context.drawImage(image, 0, 0);
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const base64 = jpegDataUrl.split(",")[1];
      const binaryString = atob(base64);

      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        hexData: bytesToHex(binaryString),
      });
    };
    image.onerror = () => reject(new Error("Failed to load Hemora logo"));
    image.src = BRAND_LOGO_PATH;
  });
}

function buildContentStream(title, rows, pageNumber, totalPages, hasLogo) {
  const lines = [];
  const generatedLabel = `Generated: ${formatDateTime(new Date())}`;
  const generatedWidth = estimateTextWidth(generatedLabel, 10);
  const generatedX = 554 - generatedWidth;
  const poweredByLabel = "Powered by CodeWave";
  const poweredByX = 306 - estimateTextWidth(poweredByLabel, 10) / 2;

  if (hasLogo) {
    lines.push("q");
    lines.push("130 0 0 62 42 768 cm");
    lines.push("/Im1 Do");
    lines.push("Q");
  }

  lines.push("0.35 0.39 0.48 rg");
  lines.push("BT");
  lines.push("/F1 10 Tf");
  lines.push(`50 748 Td (${escapePdfText(title)}) Tj`);
  lines.push("ET");

  lines.push("BT");
  lines.push("/F1 10 Tf");
  lines.push(`${generatedX} 748 Td (${escapePdfText(generatedLabel)}) Tj`);
  lines.push("ET");

  lines.push("0.85 0.87 0.91 RG");
  lines.push("1 w");
  lines.push(drawLine(50, 736, 562, 736));

  const columns = [
    { key: "id", label: "ID", x: 50 },
    { key: "name", label: "Patient Name", x: 92 },
    { key: "ageGender", label: "Age / Gender", x: 216 },
    { key: "status", label: "Status", x: 308 },
    { key: "disease", label: "Disease", x: 384 },
    { key: "dateAdded", label: "Date Added", x: 506 },
  ];

  lines.push("0.95 0.96 0.98 rg");
  lines.push("50 708 512 22 re f");
  lines.push("0.22 0.25 0.32 rg");

  columns.forEach((column) => {
    lines.push("BT");
    lines.push("/F1 10 Tf");
    lines.push(`${column.x} 715 Td (${escapePdfText(column.label)}) Tj`);
    lines.push("ET");
  });

  let currentY = 690;
  rows.forEach((row) => {
    const values = {
      id: truncate(row.id, 8),
      name: truncate(row.name, 22),
      ageGender: truncate(`${row.age} / ${row.gender}`, 14),
      status: truncate(row.status, 12),
      disease: truncate(row.disease || "Not specified", 24),
      dateAdded: formatDate(row.dateAdded),
    };

    lines.push("0.93 0.94 0.96 RG");
    lines.push("0.6 w");
    lines.push(drawLine(50, currentY - 6, 562, currentY - 6));
    lines.push("0.12 0.14 0.18 rg");

    columns.forEach((column) => {
      lines.push("BT");
      lines.push("/F1 10 Tf");
      lines.push(
        `${column.x} ${currentY} Td (${escapePdfText(values[column.key])}) Tj`,
      );
      lines.push("ET");
    });

    currentY -= 18;
  });

  lines.push("BT");
  lines.push("/F1 10 Tf");
  lines.push(
    `50 30 Td (${escapePdfText(`Total patients: ${rows.length}`)}) Tj`,
  );
  lines.push("ET");

  lines.push("BT");
  lines.push("/F1 10 Tf");
  lines.push(
    `512 30 Td (${escapePdfText(`Page ${pageNumber} of ${totalPages}`)}) Tj`,
  );
  lines.push("ET");

  lines.push("BT");
  lines.push("/F1 10 Tf");
  lines.push(`0.45 0.48 0.56 rg`);
  lines.push(
    `${poweredByX} 30 Td (${escapePdfText(poweredByLabel)}) Tj`,
  );
  lines.push("ET");

  return lines.join("\n");
}

function buildPdfDocument(title, rows, brandLogo) {
  const rowsPerPage = 34;
  const pages = [];

  for (let index = 0; index < rows.length; index += rowsPerPage) {
    pages.push(rows.slice(index, index + rowsPerPage));
  }

  if (!pages.length) {
    pages.push([]);
  }

  const objects = [];
  let nextObjectId = 1;

  const catalogId = nextObjectId++;
  const pagesId = nextObjectId++;
  const fontId = nextObjectId++;
  const imageId = brandLogo ? nextObjectId++ : null;

  const pageObjectIds = [];

  pages.forEach((pageRows, pageIndex) => {
    const pageId = nextObjectId++;
    const contentId = nextObjectId++;
    pageObjectIds.push(pageId);

    const contentStream = buildContentStream(
      title,
      pageRows,
      pageIndex + 1,
      pages.length,
      Boolean(brandLogo),
    );

    objects.push({
      id: contentId,
      content: `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`,
    });

    objects.push({
      id: pageId,
      content: `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontId} 0 R >>${
        brandLogo ? ` /XObject << /Im1 ${imageId} 0 R >>` : ""
      } >> /Contents ${contentId} 0 R >>`,
    });
  });

  const leadingObjects = [
    {
      id: fontId,
      content: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    },
    {
      id: pagesId,
      content: `<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds
        .map((id) => `${id} 0 R`)
        .join(" ")}] >>`,
    },
    {
      id: catalogId,
      content: `<< /Type /Catalog /Pages ${pagesId} 0 R >>`,
    },
  ];

  if (brandLogo) {
    leadingObjects.push({
      id: imageId,
      content: `<< /Type /XObject /Subtype /Image /Width ${brandLogo.width} /Height ${brandLogo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${brandLogo.hexData.length} >>\nstream\n${brandLogo.hexData}\nendstream`,
    });
  }

  objects.unshift(...leadingObjects);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects
    .sort((a, b) => a.id - b.id)
    .forEach((object) => {
      offsets[object.id] = pdf.length;
      pdf += `${object.id} 0 obj\n${object.content}\nendobj\n`;
    });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let objectId = 1; objectId <= objects.length; objectId += 1) {
    pdf += `${String(offsets[objectId]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

export async function downloadPatientsPdf(filename, title, rows) {
  let brandLogo = null;

  try {
    brandLogo = await loadBrandLogo();
  } catch (error) {
    console.error("Failed to load Hemora logo for PDF export:", error);
  }

  const pdfContent = buildPdfDocument(title, rows, brandLogo);
  const blob = new Blob([pdfContent], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
