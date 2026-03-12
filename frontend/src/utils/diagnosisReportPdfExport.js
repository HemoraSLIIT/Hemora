import { jsPDF } from "jspdf";

const BRAND_LOGO_PATH = "/assets/loginhemoranew2.svg";
const PAGE_WIDTH = (612 * 25.4) / 72;
const PAGE_HEIGHT = (842 * 25.4) / 72;
const MARGIN_X = 17;
const CONTENT_TOP = 34;
const CONTENT_BOTTOM = 272;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

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

function normalizeValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value)
      ? String(value)
      : String(Number(value.toFixed(2)));
  }
  return String(value)
    .replace(/10Â³\/ÂµL/g, "10^3/uL")
    .replace(/10â¶\/ÂµL/g, "10^6/uL")
    .replace(/Âµ/g, "u")
    .replace(/â€”/g, "-")
    .replace(/â€“/g, "-");
}

function resolveMediaUrl(fileUrl) {
  if (!fileUrl) return null;
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

  const mediaBase = `http://${window.location.hostname || "localhost"}:8000`;
  try {
    return new URL(fileUrl, `${mediaBase}/`).toString();
  } catch {
    return null;
  }
}

async function loadImageAsDataUrl(url) {
  if (!url) return null;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load image: ${response.status}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function loadImageDimensions(dataUrl) {
  if (!dataUrl) return null;

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function loadBrandLogo() {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        resolve(null);
        return;
      }

      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    image.onerror = () => {
      console.error("Failed to load Hemora logo for diagnosis PDF export");
      resolve(null);
    };
    image.src = BRAND_LOGO_PATH;
  });
}

function addHeaderFooter(
  pdf,
  { title, generatedAt, pageNumber, totalPages, logoDataUrl },
) {
  const titleX = 17.6;
  const titleY = 33.2;
  const lineY = 37.4;
  const generatedX = PAGE_WIDTH - 17.6;
  const footerY = 286.4;
  const footerRightX = PAGE_WIDTH - 17.6;
  const footerCenterX = PAGE_WIDTH / 2;

  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, "JPEG", 14.8, 4.2, 45.9, 21.9);
    } catch {
      // Ignore logo rendering issues and continue.
    }
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(89, 99, 122);
  pdf.text(title, titleX, titleY);
  pdf.text(generatedAt, generatedX, titleY, { align: "right" });

  pdf.setDrawColor(217, 222, 232);
  pdf.setLineWidth(0.4);
  pdf.line(titleX, lineY, PAGE_WIDTH - 17.6, lineY);

  pdf.line(MARGIN_X, 281, PAGE_WIDTH - MARGIN_X, 281);
  pdf.setTextColor(89, 99, 122);
  pdf.text(`Page ${pageNumber} of ${totalPages}`, footerRightX, footerY, {
    align: "right",
  });
  pdf.text("Powered by CodeWave", footerCenterX, footerY, { align: "center" });
}

function drawSectionTitle(pdf, title, y) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(17, 24, 39);
  pdf.text(title, MARGIN_X, y);
  return y + 4;
}

function drawRoundedCard(pdf, x, y, width, height) {
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(229, 231, 235);
  pdf.roundedRect(x, y, width, height, 4, 4, "FD");
}

function wrapText(pdf, text, width, fontSize = 10) {
  pdf.setFontSize(fontSize);
  return pdf.splitTextToSize(String(text ?? ""), width);
}

function drawLabelValue(pdf, x, y, label, value, width) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(label.toUpperCase(), x, y);

  const lines = wrapText(pdf, value, width, 11);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(17, 24, 39);
  pdf.text(lines, x, y + 4.5);
  return y + 4.5 + lines.length * 4.8;
}

function drawPatientSummary(pdf, report, startY) {
  const patientName =
    `${report.patient?.firstName || ""} ${report.patient?.lastName || ""}`.trim() ||
    "Unknown";
  const cardHeight = 35;
  drawRoundedCard(pdf, MARGIN_X, startY, CONTENT_WIDTH, cardHeight);

  const leftX = MARGIN_X + 0;
  const leftY = startY + 8;
  const leftWidth = 0;
  const leftHeight = 0;
  // pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(leftX, leftY, leftWidth, leftHeight, 3, 3, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text("PATIENT", leftX + 4, leftY + 0);
  pdf.setFontSize(14);
  pdf.setTextColor(17, 24, 39);
  pdf.text(patientName, leftX + 4, leftY + 8);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    `ID: P-${normalizeValue(report.patient?.id)}`,
    leftX + 4,
    leftY + 16,
  );

  const fields = [
    ["Status", normalizeValue(report.patient?.status)],
    ["Test Date", formatDate(report.patient?.createdAt)],
    [
      "Age / Gender",
      `${normalizeValue(report.patient?.age)} / ${normalizeValue(report.patient?.gender)}`,
    ],
    ["DOB", formatDate(report.patient?.dateOfBirth)],
  ];

  const fieldStartX = MARGIN_X + 84;
  const fieldWidth = 31;
  fields.forEach(([label, value], index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    drawLabelValue(
      pdf,
      fieldStartX + col * 33,
      startY + 8 + row * 16,
      label,
      value,
      fieldWidth,
    );
  });

  // const bannerY = startY + cardHeight + 8;
  // pdf.setFillColor(report.overallStatus === "suspicious" ? 255 : 240, report.overallStatus === "suspicious" ? 251 : 253, report.overallStatus === "suspicious" ? 235 : 244);
  // pdf.setDrawColor(report.overallStatus === "suspicious" ? 252 : 187, report.overallStatus === "suspicious" ? 211 : 247, report.overallStatus === "suspicious" ? 77 : 208);
  // pdf.roundedRect(MARGIN_X, bannerY, CONTENT_WIDTH, 14, 3, 3, "FD");
  // pdf.setFont("helvetica", "bold");
  // pdf.setFontSize(10);
  // pdf.setTextColor(report.overallStatus === "suspicious" ? 146 : 22, report.overallStatus === "suspicious" ? 64 : 101, report.overallStatus === "suspicious" ? 14 : 52);
  // pdf.text(
  //   report.overallStatus === "suspicious"
  //     ? "Suspicious parameters detected - review disease analysis below"
  //     : "All CBC parameters within normal ranges - no disease suspicion detected",
  //   18,
  //   bannerY + 8.5,
  // );

  // return bannerY + 22;
  return startY + cardHeight + 8;
}

function drawCbcTable(pdf, parameters, startY) {
  let y = drawSectionTitle(pdf, "CBC Parameter Report", startY);
  y += 3;

  const tableX = MARGIN_X;
  const widths = [56, 25, 28, 53, 20];
  const headers = ["Parameter", "Value", "Unit", "Normal Range", "Status"];
  const rowHeight = 8;
  const totalWidth = CONTENT_WIDTH;

  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(229, 231, 235);
  pdf.rect(tableX, y, totalWidth, rowHeight, "FD");

  let currentX = tableX;
  headers.forEach((header, index) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text(header.toUpperCase(), currentX + 2, y + 5.5);
    currentX += widths[index];
  });

  y += rowHeight;

  parameters.forEach((parameter) => {
    pdf.setDrawColor(243, 244, 246);
    pdf.line(tableX, y, tableX + totalWidth, y);

    const values = [
      String(parameter.parameter || "-").replace(/_/g, " "),
      normalizeValue(parameter.value),
      normalizeValue(parameter.unit),
      normalizeValue(parameter.normalRange),
      normalizeValue(parameter.status),
    ];

    currentX = tableX;
    values.forEach((value, index) => {
      if (index === 4) {
        const status = normalizeValue(parameter.status);
        const fill =
          status === "High"
            ? [254, 226, 226]
            : status === "Low"
              ? [219, 234, 254]
              : [220, 252, 231];
        const text =
          status === "High"
            ? [153, 27, 27]
            : status === "Low"
              ? [30, 64, 175]
              : [22, 101, 52];

        pdf.setFillColor(...fill);
        pdf.roundedRect(currentX + 3, y + 1.5, widths[index] - 6, 5, 2, 2, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(...text);
        pdf.text(status, currentX + widths[index] / 2, y + 5, {
          align: "center",
        });
      } else {
        pdf.setFont(
          index === 1 ? "helvetica" : "helvetica",
          index === 1 ? "bold" : "normal",
        );
        pdf.setFontSize(9);
        pdf.setTextColor(17, 24, 39);
        pdf.text(value, currentX + 2, y + 5.5);
      }
      currentX += widths[index];
    });

    y += rowHeight;
  });

  pdf.setDrawColor(229, 231, 235);
  pdf.rect(tableX, startY + 7, totalWidth, y - (startY + 7));
  return y + 10;
}

function estimateDiseaseCardHeight(pdf, disease, isHybrid) {
  const width = CONTENT_WIDTH;
  const textWidth = width - 12;
  const descriptionLines = wrapText(
    pdf,
    disease.description || "",
    textWidth,
    8,
  ).length;
  const criteria = (disease.matchedCriteria || []).slice(0, 4);
  const criteriaHeight = criteria.reduce((sum, criterion) => {
    const leftLines = wrapText(
      pdf,
      criterion.detail || "-",
      textWidth - 34,
      7.5,
    ).length;
    return sum + Math.max(10, leftLines * 4.2 + 4) + 2;
  }, 0);
  return 40 + descriptionLines * 3.6 + (isHybrid ? 16 : 0) + criteriaHeight;
}

function drawDiseaseCard(pdf, disease, x, y, width, height, isHybrid) {
  const score = disease.hybridScore ?? disease.suspicionScore ?? 0;
  const border =
    score >= 60
      ? [220, 38, 38]
      : score >= 35
        ? [245, 158, 11]
        : score > 0
          ? [59, 130, 246]
          : [34, 197, 94];
  const riskColor =
    disease.riskLevel === "High"
      ? [220, 38, 38]
      : disease.riskLevel === "Moderate"
        ? [245, 158, 11]
        : disease.riskLevel === "Low"
          ? [59, 130, 246]
          : [34, 197, 94];

  drawRoundedCard(pdf, x, y, width, height);
  pdf.setFillColor(...border);
  pdf.roundedRect(x, y, 1.8, height, 1.8, 1.8, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(17, 24, 39);
  pdf.text(disease.disease || "-", x + 4, y + 8);

  pdf.setFillColor(...border);
  pdf.roundedRect(x + width - 16, y + 4, 12, 8, 4, 4, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`${score}%`, x + width - 10, y + 9.5, { align: "center" });

  let cursorY = y + 14;
  const descriptionLines = wrapText(
    pdf,
    disease.description || "-",
    width - 12,
    8,
  );
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.text(descriptionLines, x + 4, cursorY);
  cursorY += descriptionLines.length * 3.6 + 2;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(55, 65, 81);
  pdf.text("Risk Level:", x + 4, cursorY);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...riskColor);
  pdf.text(normalizeValue(disease.riskLevel), x + 22, cursorY);
  cursorY += 8;

  if (isHybrid) {
    const boxWidth = (width - 14) / 2;
    [
      ["CBC SCORE", `${normalizeValue(disease.cbcScore)}%`],
      [
        "IMAGE SCORE",
        disease.imageScore === null
          ? "N/A"
          : `${normalizeValue(disease.imageScore)}%`,
      ],
    ].forEach(([label, value], index) => {
      const boxX = x + 4 + index * (boxWidth + 6);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(229, 231, 235);
      pdf.roundedRect(boxX, cursorY, boxWidth, 12, 2, 2, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.setTextColor(107, 114, 128);
      pdf.text(label, boxX + 2, cursorY + 4);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(17, 24, 39);
      pdf.text(value, boxX + 2, cursorY + 9);
    });
    cursorY += 16;
  }

  pdf.setFillColor(229, 231, 235);
  pdf.roundedRect(x + 4, cursorY, width - 8, 2.8, 1.4, 1.4, "F");
  pdf.setFillColor(...border);
  pdf.roundedRect(
    x + 4,
    cursorY,
    ((width - 8) * Math.max(0, Math.min(score, 100))) / 100,
    2.8,
    1.4,
    1.4,
    "F",
  );
  cursorY += 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.text(
    `${normalizeValue(disease.matchedCount)} of ${normalizeValue(disease.totalCriteria)} criteria matched`,
    x + 4,
    cursorY,
  );
  cursorY += 5;

  const criteria = (disease.matchedCriteria || []).slice(0, 4);
  criteria.forEach((criterion) => {
    const detailLines = wrapText(pdf, criterion.detail || "-", width - 42, 7.5);
    const rowHeight = Math.max(10, detailLines.length * 4.2 + 4);
    pdf.setFillColor(249, 250, 251);
    pdf.setDrawColor(229, 231, 235);
    pdf.roundedRect(x + 4, cursorY, width - 8, rowHeight, 1.5, 1.5, "FD");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(75, 85, 99);
    pdf.text(detailLines, x + 6, cursorY + 4.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(31, 41, 55);
    pdf.text(
      `${String(criterion.parameter || "-").replace(/_/g, " ")}: ${normalizeValue(criterion.value)}`,
      x + width - 6,
      cursorY + 4.5,
      { align: "right" },
    );
    cursorY += rowHeight + 2;
  });
}

function drawDiseaseAnalysis(pdf, report, startY) {
  let y = drawSectionTitle(pdf, "Disease Suspicion Analysis", startY);
  y += 4;

  const columnWidth = CONTENT_WIDTH;
  const diseases = report.diseaseAnalysis || [];

  for (let index = 0; index < diseases.length; index += 1) {
    const disease = diseases[index];
    const rowHeight = estimateDiseaseCardHeight(
      pdf,
      disease,
      report.analysisMethod === "hybrid",
    );

    if (y + rowHeight > CONTENT_BOTTOM) {
      pdf.addPage();
      y = CONTENT_TOP + 12;
    }

    drawDiseaseCard(
      pdf,
      disease,
      MARGIN_X,
      y,
      columnWidth,
      rowHeight,
      report.analysisMethod === "hybrid",
    );
    y += rowHeight + 6;
  }

  return y;
}

function drawImageCard(pdf, image, x, y, width, height) {
  drawRoundedCard(pdf, x, y, width, height);
  const imageTop = y + 4;
  const imageHeight = 50;
  const imageWidth = width - 8;

  if (image.dataUrl && image.dimensions) {
    const ratio = Math.min(
      imageWidth / image.dimensions.width,
      imageHeight / image.dimensions.height,
    );
    const drawWidth = image.dimensions.width * ratio;
    const drawHeight = image.dimensions.height * ratio;
    const drawX = x + 4 + (imageWidth - drawWidth) / 2;
    const drawY = imageTop + (imageHeight - drawHeight) / 2;
    pdf.addImage(image.dataUrl, "JPEG", drawX, drawY, drawWidth, drawHeight);
  } else {
    pdf.setFillColor(249, 250, 251);
    pdf.rect(x + 4, imageTop, imageWidth, imageHeight, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(156, 163, 175);
    pdf.text("Image unavailable", x + width / 2, imageTop + 26, {
      align: "center",
    });
  }

  pdf.setDrawColor(229, 231, 235);
  pdf.line(x, y + 58, x + width, y + 58);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(17, 24, 39);
  pdf.text(image.groupTitle || "-", x + 4, y + 65);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(107, 114, 128);
  pdf.text(image.caption || "-", x + 4, y + 71);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(147, 51, 234);
  pdf.text(
    `${normalizeValue(image.detectionsCount)} cells detected`,
    x + width - 4,
    y + 65,
    {
      align: "right",
    },
  );
}

function drawAnnotatedImages(pdf, images, startY) {
  if (!images.length) return startY;

  let y = drawSectionTitle(pdf, "Annotated Blood Smear Images", startY);
  y += 4;

  const gap = 6;
  const columnWidth = (CONTENT_WIDTH - gap) / 2;
  const cardHeight = 76;

  for (let index = 0; index < images.length; index += 2) {
    if (y + cardHeight > CONTENT_BOTTOM) {
      pdf.addPage();
      y = CONTENT_TOP + 12;
    }

    drawImageCard(pdf, images[index], MARGIN_X, y, columnWidth, cardHeight);
    if (images[index + 1]) {
      drawImageCard(
        pdf,
        images[index + 1],
        MARGIN_X + columnWidth + gap,
        y,
        columnWidth,
        cardHeight,
      );
    }
    y += cardHeight + 6;
  }

  return y;
}

function estimateCommentHeight(pdf, comment) {
  const commentLines = wrapText(
    pdf,
    comment.comment || "No comment provided",
    CONTENT_WIDTH - 12,
    9,
  );
  return 18 + commentLines.length * 4.5;
}

function drawDoctorComments(pdf, feedbackEntries, startY) {
  let y = drawSectionTitle(pdf, "Doctor's Comments", startY);
  y += 4;

  if (!feedbackEntries.length) {
    drawRoundedCard(pdf, MARGIN_X, y, CONTENT_WIDTH, 18);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text("No doctor comments submitted yet.", MARGIN_X + 4, y + 10);
    return y + 24;
  }

  feedbackEntries.forEach((entry) => {
    const height = estimateCommentHeight(pdf, entry);
    if (y + height > CONTENT_BOTTOM) {
      pdf.addPage();
      y = CONTENT_TOP;
    }

    drawRoundedCard(pdf, MARGIN_X, y, CONTENT_WIDTH, height);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text(
      (entry.decision || "Decision not set").toUpperCase(),
      MARGIN_X + 4,
      y + 6,
    );
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(
      formatDateTime(entry.createdAt),
      PAGE_WIDTH - MARGIN_X - 4,
      y + 6,
      { align: "right" },
    );

    const commentLines = wrapText(
      pdf,
      entry.comment || "No comment provided",
      CONTENT_WIDTH - 8,
      9,
    );
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(31, 41, 55);
    pdf.text(commentLines, MARGIN_X + 4, y + 13);
    y += height + 6;
  });

  return y;
}

async function prepareAnnotatedImages(images) {
  return Promise.all(
    (images || []).map(async (image) => {
      const src = resolveMediaUrl(image.image);
      try {
        const dataUrl = await loadImageAsDataUrl(src);
        const dimensions = await loadImageDimensions(dataUrl);
        return {
          ...image,
          dataUrl,
          dimensions,
          groupTitle: String(image.diseaseName || "-")
            .replace(/\s*-\s*Smear\s+\d+/i, "")
            .trim(),
          caption: image.diseaseName || "-",
        };
      } catch (error) {
        console.error("Failed to load annotated image for PDF export:", error);
        return {
          ...image,
          dataUrl: null,
          dimensions: null,
          groupTitle: String(image.diseaseName || "-")
            .replace(/\s*-\s*Smear\s+\d+/i, "")
            .trim(),
          caption: image.diseaseName || "-",
        };
      }
    }),
  );
}

export async function downloadDiagnosisReportPdf(filename, title, report) {
  const pdf = new jsPDF("p", "mm", [PAGE_WIDTH, PAGE_HEIGHT]);
  const generatedAt = `Generated: ${formatDateTime(new Date())}`;
  const logoDataUrl = await loadBrandLogo();
  const preparedImages = await prepareAnnotatedImages(
    report.annotatedImages || [],
  );

  let y = CONTENT_TOP;
  y += 12;
  y = drawPatientSummary(pdf, report, y);
  y = drawCbcTable(pdf, report.parameterReport || [], y + 3);

  pdf.addPage();
  y = CONTENT_TOP;
  y = drawDiseaseAnalysis(pdf, report, y + 12);

  if (preparedImages.length) {
    pdf.addPage();
    y = CONTENT_TOP;
    y = drawAnnotatedImages(pdf, preparedImages, y + 12);
  }

  pdf.addPage();
  y = CONTENT_TOP + 12;
  drawDoctorComments(pdf, report.feedbackEntries || [], y);

  const totalPages = pdf.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    pdf.setPage(pageNumber);
    addHeaderFooter(pdf, {
      title,
      generatedAt,
      pageNumber,
      totalPages,
      logoDataUrl,
    });
  }

  pdf.save(filename);
}
