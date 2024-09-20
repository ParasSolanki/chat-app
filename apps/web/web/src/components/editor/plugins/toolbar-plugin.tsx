import { Separator } from "@chat/ui/components/separator";
import { Toggle } from "@chat/ui/components/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@chat/ui/components/tooltip";
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "@chat/ui/icons";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import * as React from "react";
import { getSelectedNode } from "../utils/get-select-node";
import { sanitizeUrl } from "../utils/url";

const LowPriority = 1;

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = React.useState(editor);

  const [isLink, setIsLink] = React.useState(false);
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);
  const [isStrikethrough, setIsStrikethrough] = React.useState(false);

  const toolbarRef = React.useRef<HTMLDivElement>(null);

  const $updateToolbar = React.useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }
  }, []);

  const handleInsertLink = React.useCallback(() => {
    if (!isLink) {
      activeEditor.dispatchCommand(
        TOGGLE_LINK_COMMAND,
        sanitizeUrl("https://"),
      );
    } else {
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, isLink]);

  const handleFormatQuote = React.useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection();

      $setBlocksType(selection, () => $createQuoteNode());
    });
  }, [activeEditor]);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar();
          return false;
        },
        LowPriority,
      ),
    );
  }, [editor, $updateToolbar]);

  React.useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        $updateToolbar();
        setActiveEditor(newEditor);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar]);

  return (
    <div ref={toolbarRef} className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        <Hint text="Bold">
          <Toggle
            size="sm"
            type="button"
            className="h-8 px-2"
            aria-label="Format Bold"
            pressed={isBold}
            onPressedChange={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
          >
            <BoldIcon className="size-4" />
          </Toggle>
        </Hint>

        <Hint text="Italic">
          <Toggle
            size="sm"
            type="button"
            className="h-8 px-2"
            aria-label="format Italic"
            pressed={isItalic}
            onPressedChange={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
          >
            <ItalicIcon className="size-4" />
          </Toggle>
        </Hint>

        <Hint text="Underline">
          <Toggle
            size="sm"
            type="button"
            className="h-8 px-2"
            aria-label="Format Underline"
            pressed={isUnderline}
            onPressedChange={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            }}
          >
            <UnderlineIcon className="size-4" />
          </Toggle>
        </Hint>

        <Hint text="Strikethrough">
          <Toggle
            size="sm"
            type="button"
            className="h-8 px-2"
            aria-label="Format Strikethrough"
            pressed={isStrikethrough}
            onPressedChange={() => {
              activeEditor.dispatchCommand(
                FORMAT_TEXT_COMMAND,
                "strikethrough",
              );
            }}
          >
            <StrikethroughIcon className="size-4" />
          </Toggle>
        </Hint>
      </div>
      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center space-x-1">
        <Hint text="Link">
          <Toggle
            size="sm"
            type="button"
            className="h-8 px-2"
            aria-label="Insert link"
            pressed={isLink}
            onPressedChange={handleInsertLink}
          >
            <LinkIcon className="size-4" />
          </Toggle>
        </Hint>
      </div>

      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center space-x-1">
        <Hint text="Bullet List">
          <Toggle
            size="sm"
            type="button"
            className="h-8 px-2"
            aria-label="Bullet List"
            onPressedChange={() => {
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            }}
          >
            <ListIcon className="size-5" />
          </Toggle>
        </Hint>
        <Hint text="Ordered List">
          <Toggle
            size="sm"
            type="button"
            className="h-8 px-2"
            aria-label="Ordered List"
            onPressedChange={() => {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            }}
          >
            <ListOrderedIcon className="size-5" />
          </Toggle>
        </Hint>
      </div>

      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center space-x-1">
        <Hint text="Blockquote">
          <Toggle
            size="sm"
            type="button"
            className="h-8 px-2"
            aria-label="Blockquote"
            onPressedChange={handleFormatQuote}
          >
            <QuoteIcon className="size-4" />
          </Toggle>
        </Hint>
      </div>

      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center space-x-1">
        <Hint text="Code">
          <Toggle
            size="sm"
            type="button"
            className="h-8 px-2"
            aria-label="Code"
          >
            <CodeIcon className="size-4" />
          </Toggle>
        </Hint>
      </div>
    </div>
  );
}

function Hint(props: React.PropsWithChildren<{ text: string }>) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{props.children}</TooltipTrigger>
        <TooltipContent>
          <p>{props.text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
