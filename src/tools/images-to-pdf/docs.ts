// User docs for Images to PDF, shown under the tool and in its SEO page. Written from the code:
// real limits, formats and privacy behaviour only.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: ["Add images by button, drop or paste, and see one page per image.", "Reorder them by dragging or with the arrows, and rotate or remove individual images.", "Pick page size, orientation, margins and how the image fits the page; set quality for converted images.", "Optionally add document info and a file name, then press Create PDF to download."],
  howItWorks:
    "JPEG and PNG files are embedded into the PDF by pdf-lib without re-encoding, in a web worker. JPEG EXIF orientation is read and applied as a page rotation so photos from phones appear upright. Other formats (WebP, AVIF, GIF, BMP and HEIC where your browser can decode it) and mirrored JPEGs are drawn onto a canvas, with the EXIF orientation applied, and re-encoded as JPEG at the quality you choose, or as lossless PNG. Transparent areas become white in JPEG.\n\nEach image becomes a page. With a fixed page size the image is placed inside the margins, either fitted inside or filled with the overflow clipped. Fit to image makes the page the image size at 96 dpi plus margins. The PDF has no Producer, Creator or dates; only the title, author, subject and keywords you type are written.",
  limits: ["Up to 200 images, 50 MB per image and 500 MB in total; images over 100 megapixels are refused.", "Which formats convert depends on the browser. HEIC works in Safari, not Chrome or Firefox; AVIF and WebP work in current browsers.", "Animated GIFs use the first frame.", "Pages cannot exceed 200 inches; very large images are scaled down on Fit to image.", "CMYK or unusual JPEGs may display with different colours in some PDF viewers."],
  privacy:
    "Images are read and converted in your browser tab. Nothing is uploaded or stored, and the page makes no network requests with your files.",
  faqs: [
    { question: "Are my JPEGs recompressed?", answer: "No. JPEG and PNG are placed into the PDF as they are, so quality is unchanged. Only formats the PDF cannot hold, such as WebP, are converted." },
    { question: "Why do some phone photos appear rotated in other tools?", answer: "They store orientation in EXIF. This tool reads it and rotates the page content so the photo is upright in the PDF." },
    { question: "Does the PDF contain my name or the tool name?", answer: "No. Author, title and the like are empty unless you fill them in, and no Producer or Creator is written." },
    { question: "Can I mix portrait and landscape images?", answer: "Yes. With Auto orientation each page follows its image; choose Portrait or Landscape to force one." },
    { question: "Why can't I add my HEIC photo?", answer: "Your browser cannot decode it. Safari can; otherwise convert the photo to JPEG first." },
  ],
};

export default docs;
