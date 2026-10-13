import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  a: ({ href, children }) => {
    const external = href !== undefined && /^https?:\/\//.test(href);
    return (
      <a href={href} {...(external && { target: "_blank", rel: "noopener noreferrer" })}>
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
};

/** Renders lesson Markdown. Raw HTML is ignored and unsafe link schemes are stripped. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="lesson-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
