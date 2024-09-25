import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ImageNode } from "./nodes/ImageNode";

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
}

const theme = {
  root: "outline-none text-sm",
  paragraph: "text-sm",
  placeholder: "text-sm text-muted",
  heading: {
    h1: "text-xl",
    h2: "text-lg",
    h3: "text-base",
    h4: "text-sm",
    h5: "text-xs",
    h6: "text-xs",
  },
  text: {
    code: "font-mono p-1 rounded bg-muted",
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "line-through underline",
  },
  list: {
    ol: "list-decimal list-inside",
    ul: "list-disc list-inside",
    nested: {
      listitem: "list-none",
    },
  },
  quote: "border-l-4 border-solid mb-2 pl-4 ml-4 mr-0 border-l-border text-sm",
  link: "underline text-blue-400",
  image: "block max-w-full",
} satisfies InitialConfigType["theme"];

const nodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  AutoLinkNode,
  LinkNode,
  CodeNode,
  CodeHighlightNode,
  ImageNode,
];

const defaultConfig = {
  namespace: "MyEditor",
  theme,
  onError,
  nodes,
} satisfies InitialConfigType;

type LexicalProviderProps = {
  initialConfig?: Omit<InitialConfigType, "theme" | "nodes">;
};

export function LexicalProvider(
  props: React.PropsWithChildren<LexicalProviderProps>,
) {
  const config = props?.initialConfig ?? defaultConfig;
  const initialConfig = { ...config, theme, nodes };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      {props.children}
    </LexicalComposer>
  );
}
