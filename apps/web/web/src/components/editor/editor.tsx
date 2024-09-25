import { cn } from "@chat/ui/cn";
import { Button } from "@chat/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@chat/ui/components/dropdown-menu";
import { ScrollArea } from "@chat/ui/components/scroll-area";
import { Toggle } from "@chat/ui/components/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@chat/ui/components/tooltip";
import {
  ALargeSmallIcon,
  LaptopIcon,
  PlusIcon,
  SendHorizonalIcon,
} from "@chat/ui/icons";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useDropContext } from "~/contexts/drop";
import {
  $getRoot,
  $isParagraphNode,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import type { EditorState, LexicalEditor } from "lexical";
import * as React from "react";
import { INSERT_IMAGE_COMMAND } from "./nodes/ImageNode";
import { AutoLinkPlugin } from "./plugins/auto-link-plugin";
import { DraggableBlockPlugin } from "./plugins/draggable-block-plugin";
import { ImagesPlugin } from "./plugins/images-plugin";
import { LinkEditorPlugin } from "./plugins/link-editor";
import { ListMaxIndentLevelPlugin } from "./plugins/list-max-indent-level-plugin";
import { MarkdownShortcutPlugin } from "./plugins/markdown-shortcut-plugin";
import { MaxLengthPlugin } from "./plugins/max-length-plugin";
import TabFocusPlugin from "./plugins/tab-focus-plugin";
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
  const [isLinkEditMode, setIsLinkEditMode] = React.useState(false);

  const [floatingAnchorElem, setFloatingAnchorElem] =
    React.useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onChange = React.useCallback((_editorState: EditorState) => {
    // const json = editorState.toJSON();
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
        mode !== "view" && "space-y-2 rounded-md border bg-background",
      )}
    >
      {!isToolbarHidden && mode !== "view" && <ToolbarPlugin />}
      <div
        className={cn(
          "editor relative",

          isToolbarHidden && "pt-2",
        )}
        ref={onRef}
      >
        <RichTextPlugin
          ErrorBoundary={LexicalErrorBoundary}
          contentEditable={
            <ScrollArea
              className={cn(
                mode !== "view" && "max-h-80",
                isEditorEmpty && mode !== "view" && "px-7",
              )}
            >
              <ContentEditable
                className="min-h-6 outline-none"
                placeholder={<Placeholder text={placeholder} />}
                aria-placeholder={placeholder}
              />
            </ScrollArea>
          }
        />

        <HistoryPlugin />
        <AutoFocusPlugin />
        <AutoLinkPlugin />
        <TabFocusPlugin />
        <ListPlugin />
        <ImagesPlugin />
        <OnChangePlugin onChange={onChange} />
        <ListMaxIndentLevelPlugin maxDepth={7} />
        <MaxLengthPlugin maxLength={1000} />
        <MarkdownShortcutPlugin />
        {floatingAnchorElem && (
          <>
            <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
            <LinkEditorPlugin
              anchorElem={floatingAnchorElem}
              isLinkEditMode={isLinkEditMode}
              setIsLinkEditMode={setIsLinkEditMode}
            />
          </>
        )}
      </div>

      <div
        className={cn(
          "z-0 flex items-center justify-between",
          mode !== "view" && "px-3 pb-2",
        )}
      >
        {mode !== "view" && (
          <div className="flex items-center space-x-1">
            <AttachDropdown />
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

function AttachDropdown() {
  const [editor] = useLexicalComposerContext();
  const { open } = useDropContext();
  const [activeEditor, setActiveEditor] = React.useState(editor);

  React.useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);

        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  return (
    <DropdownMenu>
      <Hint text="Attach">
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="secondary"
            type="button"
            className="size-8"
          >
            <PlusIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent side="bottom" align="start" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                altText: "Sample",
                src: "https://plus.unsplash.com/premium_photo-1677560517139-1836389bf843?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyfHx8ZW58MHx8fHx8",
              });
            }}
          >
            <LaptopIcon className="mr-2 size-4" aria-hidden />
            URL
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={open}>
            <LaptopIcon className="mr-2 size-4" aria-hidden />
            Upload from your computer
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
