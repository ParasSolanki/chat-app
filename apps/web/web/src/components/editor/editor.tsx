import { cn } from "@chat/ui/cn";
import { Button } from "@chat/ui/components/button.tsx";
import { ScrollArea } from "@chat/ui/components/scroll-area.tsx";
import { Toggle } from "@chat/ui/components/toggle.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@chat/ui/components/tooltip.tsx";
import { ALargeSmallIcon, PlusIcon, SendHorizonalIcon } from "@chat/ui/icons";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getRoot, $isParagraphNode } from "lexical";
import type { EditorState, LexicalEditor } from "lexical";
import * as React from "react";
import { AutoLinkPlugin } from "./plugins/auto-link-plugin";
import ListMaxIndentLevelPlugin from "./plugins/list-max-indent-level-plugin";
import { ToolbarPlugin } from "./plugins/toolbar-plugin";

type EditorProps = {
  placeholder?: string;
  mode?: "view" | "edit" | "create";
  onMount?: (editor: LexicalEditor) => void;
  onSave?: (json: string) => void;
  onCancel?: () => void;
};

function Placeholder({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute top-0 inline-block select-none overflow-hidden whitespace-nowrap text-muted-foreground">
      {text}
    </div>
  );
}

export function Editor({
  placeholder = "Enter message",
  mode = "create",
  onMount,
  onSave,
  onCancel,
}: EditorProps) {
  const [editor] = useLexicalComposerContext();
  const [isEditorEmpty, setIsEditorEmpty] = React.useState(true);
  const [isToolbarHidden, setIsToolbarHidden] = React.useState(false);

  const onChange = React.useCallback((editorState: EditorState) => {
    const json = editorState.toJSON();
  }, []);

  const toogleToolbarHidden = React.useCallback(() => {
    setIsToolbarHidden((isHidden) => !isHidden);
  }, []);

  const handleOnSave = React.useCallback(() => {
    if (isEditorEmpty) return;
    const json = JSON.stringify(editor.getEditorState().toJSON());

    onSave?.(json);
  }, [onSave, editor, isEditorEmpty]);

  React.useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();

        if (children.length > 1) {
          setIsEditorEmpty(false);
        } else {
          if ($isParagraphNode(children[0])) {
            const paragraphChildren = children[0].getChildren();
            setIsEditorEmpty(paragraphChildren.length === 0);
          } else {
            setIsEditorEmpty(false);
          }
        }
      });
    });
  }, [editor]);

  React.useEffect(() => {
    onMount?.(editor);
  }, [editor, onMount]);

  return (
    <div
      className={cn(
        "relative",
        mode !== "view" && "space-y-2 rounded-md border bg-background p-2",
      )}
    >
      {!isToolbarHidden && mode !== "view" && <ToolbarPlugin />}
      <ScrollArea className="max-h-52">
        <div className={cn(mode !== "view" && "px-2")}>
          <RichTextPlugin
            ErrorBoundary={LexicalErrorBoundary}
            contentEditable={
              <ContentEditable
                className="min-h-6 outline-none"
                placeholder={<Placeholder text={placeholder} />}
              />
            }
          />

          <AutoFocusPlugin />
          <AutoLinkPlugin />
          <ListPlugin />
          <OnChangePlugin onChange={onChange} />
          <ListMaxIndentLevelPlugin maxDepth={7} />
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between">
        {mode !== "view" && (
          <div className="flex items-center space-x-1">
            <Hint text="Attach">
              <Button
                size="icon"
                variant="secondary"
                type="button"
                className="size-8"
              >
                <PlusIcon className="size-4" />
              </Button>
            </Hint>
            <Hint
              text={isToolbarHidden ? "Show formatting" : "Hide formatting"}
            >
              <Toggle
                size="sm"
                type="button"
                className="h-8 px-2"
                aria-label={
                  isToolbarHidden ? "Show formatting" : "Hide formatting"
                }
                pressed={isToolbarHidden}
                onPressedChange={toogleToolbarHidden}
              >
                <ALargeSmallIcon className="size-4" />
              </Toggle>
            </Hint>
          </div>
        )}

        {mode === "create" && (
          <Hint text="Send now">
            <Button
              size="icon"
              type="button"
              className="size-8"
              disabled={isEditorEmpty}
              onClick={handleOnSave}
            >
              <SendHorizonalIcon className="size-4" />
            </Button>
          </Hint>
        )}
        {mode === "edit" && (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => onCancel?.()}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              type="button"
              disabled={isEditorEmpty}
              onClick={handleOnSave}
            >
              Save
            </Button>
          </div>
        )}
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
