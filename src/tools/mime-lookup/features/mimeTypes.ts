// Common MIME types and their file extensions, based on the IANA media type registry and
// the Apache / nginx / mime-db mappings. One line per type: "<mime> <ext> [<ext>…] [~]".
// A trailing "~" flips the default compressibility for that category.

export type Category = 'image' | 'audio' | 'video' | 'text' | 'code' | 'data' | 'document' | 'font' | 'archive' | 'application' | 'model';

export interface MimeType {
  mime: string;
  extensions: string[];
  category: Category;
  /** Worth gzip/brotli compression when served over HTTP. */
  compressible: boolean;
}

// [category, compressible by default, lines]
const GROUPS: [Category, boolean, string][] = [
  ['image', false, `
image/png png
image/jpeg jpg jpeg jpe jfif
image/gif gif
image/webp webp
image/avif avif
image/heic heic
image/heif heif
image/svg+xml svg svgz ~
image/bmp bmp dib ~
image/x-icon ico cur ~
image/vnd.microsoft.icon ~
image/tiff tif tiff ~
image/apng apng
image/jxl jxl
image/jp2 jp2 j2k
image/jpx jpx jpf
image/vnd.adobe.photoshop psd ~
image/x-xcf xcf ~
image/x-portable-pixmap ppm ~
image/x-portable-graymap pgm ~
image/x-portable-bitmap pbm ~
image/x-portable-anymap pnm ~
image/x-tga tga ~
image/x-canon-cr2 cr2
image/x-canon-cr3 cr3
image/x-nikon-nef nef
image/x-sony-arw arw
image/x-adobe-dng dng
image/x-xbitmap xbm ~
image/x-xpixmap xpm ~
image/vnd.djvu djvu djv
image/x-exr exr
image/vnd.radiance hdr
image/ktx2 ktx2
image/vnd.ms-dds dds
image/x-pcx pcx
image/emf emf ~
image/wmf wmf ~
`],
  ['audio', false, `
audio/mpeg mp3 mpga mp2
audio/aac aac
audio/mp4 m4a mp4a
audio/x-m4b m4b
audio/ogg ogg oga spx
audio/opus opus
audio/wav wav ~
audio/x-wav ~
audio/webm weba
audio/flac flac
audio/x-aiff aif aiff aifc ~
audio/midi mid midi kar ~
audio/x-ms-wma wma
audio/amr amr
audio/3gpp 3ga
audio/x-matroska mka
audio/basic au snd ~
audio/x-caf caf
audio/ac3 ac3
audio/vnd.dts dts
audio/x-ape ape
audio/x-mpegurl m3u ~
audio/x-scpls pls ~
audio/x-tta tta
audio/wavpack wv
audio/x-mod mod
`],
  ['video', false, `
video/mp4 mp4 mp4v mpg4 m4v
video/webm webm
video/ogg ogv
video/quicktime mov qt
video/x-msvideo avi
video/x-matroska mkv mk3d
video/mpeg mpeg mpg mpe m1v m2v
video/mp2t ts m2ts mts
video/3gpp 3gp
video/3gpp2 3g2
video/x-flv flv
video/x-ms-wmv wmv
video/x-ms-asf asf asx
video/h264 h264
video/h265 h265
video/av1
video/vnd.dlna.mpeg-tts
video/x-f4v f4v
video/x-m4v
video/iso.segment m4s
video/x-ivf ivf
video/x-mng mng
`],
  ['text', true, `
text/plain txt text conf def list log in ini
text/html html htm shtml
text/css css
text/csv csv
text/tab-separated-values tsv tab
text/markdown md markdown mdx
text/calendar ics ifb
text/vcard vcf vcard
text/richtext rtx
text/enriched
text/rtf
text/uri-list uri uris urls
text/vtt vtt
text/x-srt srt
text/x-ssa ssa ass
text/troff t tr roff man me ms
text/x-setext etx
text/x-nfo nfo
text/x-sfv sfv
text/xml
text/sgml sgml sgm
text/n3 n3
text/turtle ttl
text/x-org org
text/x-asciidoc adoc asciidoc
text/x-rst rst
text/x-tex tex latex ltx sty cls
text/x-bibtex bib
text/cache-manifest appcache manifest
text/x-diff diff patch
text/event-stream
`],
  ['code', true, `
text/javascript js mjs cjs
application/javascript
text/jsx jsx
text/typescript ts mts cts
text/tsx tsx
text/x-python py pyw pyi
text/x-java-source java
text/x-c c h
text/x-c++src cpp cc cxx c++ hpp hh hxx
text/x-csharp cs
text/x-go go
text/x-rust rs
text/x-ruby rb
text/x-php php
application/x-httpd-php phtml
text/x-perl pl pm
text/x-lua lua
text/x-swift swift
text/x-kotlin kt kts
text/x-scala scala sc
text/x-haskell hs
text/x-elixir ex exs
text/x-erlang erl hrl
text/x-clojure clj cljs cljc edn
text/x-dart dart
text/x-r r
text/x-julia jl
text/x-fortran f f77 f90 for
text/x-pascal pas p
text/x-asm asm s
text/x-shellscript sh bash zsh
application/x-sh
application/x-csh csh
text/x-powershell ps1 psm1 psd1
application/x-bat bat cmd
text/x-sql sql
text/x-vue vue
text/x-svelte svelte
text/x-astro astro
text/x-scss scss
text/x-sass sass
text/x-less less
text/x-stylus styl
text/x-handlebars-template hbs handlebars
text/x-nunjucks njk
text/x-pug pug jade
text/x-ejs ejs
text/x-liquid liquid
text/x-objective-c m mm
text/x-groovy groovy gradle
text/x-zig zig
text/x-nim nim
text/x-ocaml ml mli
text/x-fsharp fs fsi fsx
text/x-vb vb vbs
text/x-makefile mk
text/x-cmake cmake
text/x-dockerfile dockerfile
text/x-graphql graphql gql
text/x-protobuf proto
text/x-solidity sol
text/x-wgsl wgsl
text/x-glsl glsl vert frag
text/x-hlsl hlsl
`],
  ['data', true, `
application/json json map
application/ld+json jsonld
application/manifest+json webmanifest
application/geo+json geojson
application/schema+json
application/problem+json
application/json5 json5
application/x-ndjson ndjson jsonl
application/xml xml xsl xsd dtd
application/rss+xml rss
application/atom+xml atom
application/xhtml+xml xhtml xht
application/rdf+xml rdf owl
application/mathml+xml mathml
application/xslt+xml xslt
application/gpx+xml gpx
application/vnd.google-earth.kml+xml kml
application/vnd.google-earth.kmz kmz ~
application/yaml yaml yml
application/toml toml
application/x-plist plist
application/sql
application/graphql
application/x-www-form-urlencoded
multipart/form-data
multipart/byteranges
multipart/mixed
multipart/alternative
message/rfc822 eml mime
message/http
application/mbox mbox
application/x-subrip
application/x-protobuf pb ~
application/cbor cbor ~
application/msgpack msgpack ~
application/vnd.apache.parquet parquet ~
application/vnd.apache.avro avro ~
application/vnd.apache.arrow.file arrow feather ~
application/x-hdf5 h5 hdf5 ~
application/x-netcdf nc ~
application/x-sqlite3 sqlite sqlite3 db ~
application/vnd.sqlite3 ~
application/dicom dcm ~
application/x-bittorrent torrent ~
application/pgp-signature sig asc
application/pgp-encrypted pgp ~
application/pkcs7-mime p7m p7c ~
application/pkcs7-signature p7s ~
application/pkcs8 p8 ~
application/pkcs10 p10 ~
application/pkcs12 p12 pfx ~
application/pkix-cert cer ~
application/x-x509-ca-cert crt der ~
application/x-pem-file pem key
application/pkix-crl crl ~
application/jwk+json jwk
application/jose+json
application/jwt jwt
application/csp-report
application/reports+json
application/x-ipynb+json ipynb
application/vnd.dart
application/x-yaml
application/dns-message ~
application/ogg ogx ~
application/x-shockwave-flash swf ~
`],
  ['document', false, `
application/pdf pdf
application/msword doc dot
application/vnd.openxmlformats-officedocument.wordprocessingml.document docx
application/vnd.openxmlformats-officedocument.wordprocessingml.template dotx
application/vnd.ms-excel xls xlt xla
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet xlsx
application/vnd.openxmlformats-officedocument.spreadsheetml.template xltx
application/vnd.ms-excel.sheet.macroEnabled.12 xlsm
application/vnd.ms-excel.sheet.binary.macroEnabled.12 xlsb
application/vnd.ms-powerpoint ppt pps pot
application/vnd.openxmlformats-officedocument.presentationml.presentation pptx
application/vnd.openxmlformats-officedocument.presentationml.slideshow ppsx
application/vnd.openxmlformats-officedocument.presentationml.template potx
application/vnd.ms-project mpp
application/vnd.visio vsd
application/vnd.ms-visio.drawing vsdx
application/vnd.ms-outlook msg
application/vnd.ms-access mdb
application/vnd.oasis.opendocument.text odt
application/vnd.oasis.opendocument.spreadsheet ods
application/vnd.oasis.opendocument.presentation odp
application/vnd.oasis.opendocument.graphics odg
application/vnd.oasis.opendocument.formula odf
application/vnd.apple.pages pages
application/vnd.apple.numbers numbers
application/vnd.apple.keynote key
application/rtf rtf ~
application/epub+zip epub
application/x-mobipocket-ebook mobi prc
application/vnd.amazon.ebook azw
application/x-fictionbook+xml fb2 ~
application/vnd.ms-xpsdocument xps
application/oxps oxps
application/postscript ps eps ai ~
application/x-latex ~
application/x-dvi dvi
application/vnd.comicbook+zip cbz
application/vnd.comicbook-rar cbr
application/x-abiword abw ~
application/vnd.ms-fontobject eot ~
application/onenote one
application/x-mspublisher pub
`],
  ['font', false, `
font/woff woff
font/woff2 woff2
font/ttf ttf ~
font/otf otf ~
font/collection ttc ~
application/font-sfnt ~
application/x-font-bdf bdf ~
application/x-font-pcf pcf ~
application/x-font-type1 pfa pfb pfm afm ~
`],
  ['archive', false, `
application/zip zip
application/gzip gz tgz
application/x-tar tar ~
application/x-bzip bz
application/x-bzip2 bz2 tbz2
application/x-xz xz txz
application/zstd zst
application/x-lzip lz
application/x-lzma lzma
application/x-lz4 lz4
application/x-7z-compressed 7z
application/vnd.rar rar
application/x-rar-compressed
application/x-compress z
application/x-cpio cpio ~
application/x-archive ar
application/x-iso9660-image iso ~
application/x-apple-diskimage dmg
application/java-archive jar war ear
application/vnd.android.package-archive apk
application/x-xpinstall xpi
application/x-chrome-extension crx
application/x-debian-package deb
application/x-redhat-package-manager rpm
application/x-rpm
application/vnd.ms-cab-compressed cab
application/x-snap snap
application/vnd.flatpak flatpak
application/x-msix msix appx
application/x-ace-compressed ace
application/x-arj arj
application/x-stuffit sit
application/x-gtar gtar
`],
  ['application', false, `
application/octet-stream bin exe dll so dylib class o obj
application/wasm wasm ~
application/x-msdownload msi com
application/x-msdos-program
application/x-mach-binary
application/x-elf elf
application/x-executable
application/vnd.microsoft.portable-executable
application/x-ms-shortcut lnk
application/x-apple-app ipa
application/x-sharedlib
application/x-python-code pyc pyo
application/x-java-jnlp-file jnlp ~
application/x-ms-application application ~
application/x-shockwave-flash
application/x-silverlight-app xap
application/vnd.apple.installer+xml mpkg ~
application/x-newton-compatible-pkg pkg
application/x-nintendo-nes-rom nes
application/x-virtualbox-vdi vdi
application/x-virtualbox-ova ova
application/x-vhd vhd
application/x-qemu-disk qcow2
application/vnd.tcpdump.pcap pcap cap
application/x-keepass2 kdbx
application/x-bittorrent
application/vnd.apple.mpegurl m3u8 ~
application/dash+xml mpd ~
application/vnd.ms-pki.stl
application/x-ole-storage
application/vnd.ms-htmlhelp chm
application/x-shar shar ~
`],
  ['model', false, `
model/gltf+json gltf ~
model/gltf-binary glb
model/obj ~
model/stl stl
model/3mf 3mf
model/vnd.usdz+zip usdz
model/iges igs iges ~
model/step step stp ~
model/vrml wrl vrml ~
model/x3d+xml x3d ~
model/vnd.collada+xml dae ~
application/x-blender blend
application/x-fbx fbx
application/vnd.ms-3mfdocument
application/x-ply ply
`],
];

function parse(): MimeType[] {
  const out: MimeType[] = [];
  const seenMime = new Set<string>();
  for (const [category, defaultCompressible, block] of GROUPS) {
    for (const line of block.trim().split('\n')) {
      const parts = line.trim().split(/\s+/);
      const flip = parts[parts.length - 1] === '~';
      if (flip) parts.pop();
      const [mime, ...exts] = parts;
      if (seenMime.has(mime)) continue;
      seenMime.add(mime);
      out.push({ mime, extensions: exts, category, compressible: flip ? !defaultCompressible : defaultCompressible });
    }
  }
  return out;
}

export const MIME_TYPES: MimeType[] = parse();

/** Extensions made of two parts that should be matched as a whole. */
const COMPOUND: Record<string, string> = { 'tar.gz': 'tgz', 'tar.bz2': 'tbz2', 'tar.xz': 'txz', 'd.ts': 'ts' };

const BY_EXT = new Map<string, MimeType>();
// Some extensions are shared (".ts" is MPEG-TS video and TypeScript); the first listed wins for lookups.
for (const t of MIME_TYPES) for (const e of t.extensions) if (!BY_EXT.has(e)) BY_EXT.set(e, t);

/** Extension of a file name (lower-cased, no dot), or '' if there is none. */
export function extensionOf(fileName: string): string {
  const base = fileName.trim().split(/[\\/]/).pop()!.toLowerCase();
  const parts = base.split('.');
  if (parts.length < 2) return '';
  const two = parts.slice(-2).join('.');
  if (parts.length >= 3 && two in COMPOUND) return two;
  const last = parts[parts.length - 1];
  // Dotfiles like ".gitignore" have no extension.
  return parts.length === 2 && parts[0] === '' ? '' : last;
}

/** The type registered for a file name or bare extension ("png", ".png", "report.final.pdf"). */
export function lookupExtension(nameOrExt: string): MimeType | undefined {
  const s = nameOrExt.trim().toLowerCase();
  if (!s) return undefined;
  if (BY_EXT.has(s.replace(/^\./, ''))) return BY_EXT.get(s.replace(/^\./, ''));
  const ext = extensionOf(s.startsWith('.') && !s.slice(1).includes('.') ? 'x' + s : s);
  if (!ext) return undefined;
  return BY_EXT.get(ext) ?? BY_EXT.get(COMPOUND[ext] ?? '');
}

/**
 * Search by extension, MIME type (anything containing "/"), file name, or free text.
 * Exact extension matches come first, then extension prefixes, then MIME substrings.
 */
export function searchMime(query: string, list: MimeType[] = MIME_TYPES): MimeType[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  if (q.includes('/')) {
    return list
      .filter((t) => t.mime.includes(q))
      .sort((a, b) => Number(!a.mime.startsWith(q)) - Number(!b.mime.startsWith(q)) || a.mime.localeCompare(b.mime));
  }
  const exact = lookupExtension(q);
  const bare = q.replace(/^\./, '');
  const rank = (t: MimeType): number => {
    if (t === exact) return 0;
    if (t.extensions.includes(bare)) return 1;
    if (t.extensions.some((e) => e.startsWith(bare))) return 2;
    if (t.mime.split(/[/+.-]/).some((p) => p.startsWith(bare))) return 3;
    if (t.mime.includes(bare) || t.category === bare) return 4;
    return -1;
  };
  // A file name with a known extension shows just that match.
  if (exact && bare.includes('.')) return [exact];
  return list
    .map((t) => ({ t, r: rank(t) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.t);
}
