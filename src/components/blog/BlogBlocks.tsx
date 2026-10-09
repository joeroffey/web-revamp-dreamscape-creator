import { Fragment, ReactNode } from "react";
import { BlogBlock, imageSizeClass } from "@/lib/blogBlocks";

interface Props {
  blocks: BlogBlock[];
  /** Post title — used to avoid repeating it as a sub-heading */
  title?: string;
}

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)|(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;

/**
 * Turns [text](https://…) and bare https:// URLs into links, so sources and
 * internal links can be added from the existing admin blog editor.
 */
const renderInline = (text: string): ReactNode[] => {
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const label = match[1] ?? match[3];
    const href = match[2] ?? match[3];
    const internal = href.startsWith("/");
    out.push(
      <a
        key={`${match.index}-${href}`}
        href={href}
        className="underline underline-offset-2 hover:text-foreground"
        {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {label}
      </a>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Many posts were written with the section heading as the first line of a
 * paragraph. Treat a short first line with no closing full stop as a real
 * <h2>, which gives the article a proper heading structure for readers and
 * search engines.
 */
const looksLikeHeading = (line: string) => {
  const t = line.trim();
  return (
    t.length > 2 &&
    t.length <= 90 &&
    !/[.,;:!]$/.test(t) &&
    !/^\d+[.)]\s/.test(t) &&
    t.split(/\s+/).length <= 14
  );
};

const renderLines = (lines: string[]) =>
  lines.map((line, i) => (
    <Fragment key={i}>
      {renderInline(line)}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));

const renderParagraph = (text: string, title?: string) => {
  const lines = text.split("\n");
  if (lines.length > 1 && looksLikeHeading(lines[0])) {
    const heading = lines[0].trim();
    const rest = lines.slice(1);
    const isTitle = title && normalise(heading) === normalise(title);
    return (
      <>
        {!isTitle && (
          <h2 className="text-2xl md:text-3xl font-light tracking-wide pt-6 mb-4">{heading}</h2>
        )}
        <p className="text-foreground/80 leading-relaxed text-lg">{renderLines(rest)}</p>
      </>
    );
  }
  return <p className="text-foreground/80 leading-relaxed text-lg">{renderLines(lines)}</p>;
};

export const BlogBlocksRenderer = ({ blocks, title }: Props) => {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        switch (block.type) {
          case "paragraph":
            return <div key={block.id}>{renderParagraph(block.text, title)}</div>;
          case "heading":
            return block.level === 3 ? (
              <h3 key={block.id} className="text-xl md:text-2xl font-light tracking-wide pt-4">
                {block.text}
              </h3>
            ) : (
              <h2 key={block.id} className="text-2xl md:text-3xl font-light tracking-wide pt-6">
                {block.text}
              </h2>
            );
          case "quote":
            return (
              <blockquote
                key={block.id}
                className="border-l-4 border-primary pl-6 py-2 italic text-xl text-foreground/85"
              >
                {renderInline(block.text)}
              </blockquote>
            );
          case "image":
            return (
              <figure key={block.id} className="my-4 flex flex-col items-center">
                <img
                  src={block.url}
                  alt={block.alt || ""}
                  width={1200}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className={`${imageSizeClass(block.size)} w-full h-auto rounded-2xl object-cover`}
                />
                {block.alt && (
                  <figcaption className="mt-2 text-sm text-muted-foreground text-center italic">
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
