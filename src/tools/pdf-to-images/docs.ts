// User docs for PDF to Images, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose a PDF (enter its password if it has one).',
    'Optionally type which pages to convert, such as 1-3, 5. Leave it empty for every page.',
    'Pick PNG, JPG or WebP, the resolution and, for JPG/WebP, the quality.',
    'Convert, then download single images or all of them as a ZIP.',
  ],
  howItWorks:
    'The PDF is opened with pdf.js, Mozilla’s PDF renderer, which loads only when you use this tool. Each selected page is drawn onto a canvas at your chosen resolution and saved with the browser’s own image encoder. The scale is DPI ÷ 72, since PDF units are 1/72 inch.\n\nJPG pages get a white background because JPG has no transparency.',
  limits: [
    'PDFs up to 200 MB. Very large pages are rendered at a lower resolution so one image stays under 40 megapixels.',
    'Images in the PDF that use JPEG 2000 or JBIG2 compression may not render, because their WebAssembly decoders are turned off for security.',
    'Fonts that aren’t embedded in the PDF are drawn with a similar system font, so text can look slightly different.',
    'Pages render one at a time on this page, so long PDFs at high DPI take a while.',
  ],
  privacy: 'The PDF and images never leave your device: everything is rendered in your browser, and nothing is uploaded or stored. A password you enter is only used to open the file.',
  faqs: [
    {
      question: 'Which resolution should I pick?',
      answer: '150 DPI is good for screens and sharing; 300 DPI is print quality but produces much larger files.',
    },
    {
      question: 'PNG, JPG or WebP?',
      answer: 'PNG keeps text perfectly sharp and is best for documents. JPG and WebP are much smaller and suit pages that are mostly photos.',
    },
    {
      question: 'Can I convert only some pages?',
      answer: 'Yes. Type pages and ranges like 1-3, 7, 10- (10- means page 10 to the end).',
    },
  ],
};

export default docs;
