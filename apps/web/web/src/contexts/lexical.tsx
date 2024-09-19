import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";

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
    h1: "text-3xl",
    h2: "text-2xl",
    h3: "text-xl",
    h4: "text-lg",
    h5: "text-base",
    h6: "text-sm",
  },
  text: {
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
} satisfies InitialConfigType["theme"];

const nodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  AutoLinkNode,
  LinkNode,
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
