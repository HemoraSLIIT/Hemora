import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

function waitForImages(container) {
  const images = Array.from(container.querySelectorAll("img"));

  return Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    }),
  );
}

function createCaptureClone(element) {
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.width = "1200px";
  wrapper.style.padding = "24px";
  wrapper.style.background = "#ffffff";
  wrapper.style.opacity = "0";
  wrapper.style.pointerEvents = "none";
  wrapper.style.zIndex = "-1";
  wrapper.style.overflow = "hidden";

  const clone = element.cloneNode(true);
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  return { wrapper, clone };
}

export async function exportElementToPdf(element, filename) {
  if (!element) {
    throw new Error("Report element not found");
  }

  const { wrapper, clone } = createCaptureClone(element);

  try {
    await waitForImages(clone);

    const dataUrl = await toJpeg(clone, {
      quality: 0.96,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      skipFonts: false,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    const imgHeight = (img.height * usableWidth) / img.width;
    const usableHeight = pageHeight - margin * 2;

    let remainingHeight = imgHeight;
    let positionY = margin;

    pdf.addImage(dataUrl, "JPEG", margin, positionY, usableWidth, imgHeight);
    remainingHeight -= usableHeight;

    while (remainingHeight > 0) {
      positionY = remainingHeight - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(dataUrl, "JPEG", margin, positionY, usableWidth, imgHeight);
      remainingHeight -= usableHeight;
    }

    pdf.save(filename);
  } finally {
    wrapper.remove();
  }
}
