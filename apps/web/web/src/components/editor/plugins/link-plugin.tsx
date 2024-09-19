// Source: https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/LinkPlugin/index.tsx

import { LinkPlugin as LexicalLinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { validateUrl } from "../utils/url";

export function LinkPlugin() {
  return <LexicalLinkPlugin validateUrl={validateUrl} />;
}
