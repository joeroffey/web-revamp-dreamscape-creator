import { BlogBlock, imageSizeClass } from "@/lib/blogBlocks";

interface Props {
  blocks: BlogBlock[];
}

const renderParagraph = (text: string) => {
  // Single newlines become <br/>
  const lines = text.split("\n");
  return (
    <p className="text-foreground/80 leading-relaxed text-lg">
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </p>
  );
};

export const BlogBlocksRenderer = ({ blocks }: Props) => {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        switch (block.type) {
          case "paragraph":
            return <div key={block.id}>{renderParagraph(block.text)}</div>;
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
                {block.text}
              </blockquote>
            );
          case "image":
            return (
              <figure key={block.id} className="my-4 flex flex-col items-center">
                <img
                  src={block.url}
                  alt={block.alt || ""}
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
