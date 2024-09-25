import {
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from "@lexical/markdown";
import { MarkdownShortcutPlugin as LexicalMarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";

const TRANSFORMERS = [
  ...ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];

export function MarkdownShortcutPlugin() {
  return <LexicalMarkdownShortcutPlugin transformers={TRANSFORMERS} />;
}
