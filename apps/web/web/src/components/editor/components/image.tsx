import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type BaseSelection,
  type LexicalEditor,
  type NodeKey,
} from "lexical";
import * as React from "react";
import { $isImageNode } from "../nodes/ImageNode";

const imageCache = new Set();

function useSuspenseImage(src: string) {
  if (!imageCache.has(src)) {
    throw new Promise((resolve) => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        imageCache.add(src);
        resolve(null);
      };
      img.onerror = () => {
        imageCache.add(src);
      };
    });
  }
}

function LazyImage({
  altText,
  className,
  imageRef,
  src,
  width,
  height,
  maxWidth,
  onError,
}: {
  altText: string;
  className: string | null;
  height: "inherit" | number;
  imageRef: { current: null | HTMLImageElement };
  maxWidth: number;
  src: string;
  width: "inherit" | number;
  onError: () => void;
}) {
  useSuspenseImage(src);

  return (
    <img
      className={className || undefined}
      src={src}
      alt={altText}
      ref={imageRef}
      style={{
        height,
        maxWidth,
        width,
      }}
      loading="lazy"
      decoding="async"
      onError={onError}
      draggable="false"
    />
  );
}

type ImageProps = {
  altText: string;
  height: "inherit" | number;
  maxWidth: number;
  nodeKey: NodeKey;
  src: string;
  width: "inherit" | number;
};

export function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  maxWidth,
}: ImageProps) {
  const [editor] = useLexicalComposerContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selection, setSelection] = React.useState<BaseSelection | null>(null);
  const [isLoadError, setIsLoadError] = React.useState(false);
  const [isSelected] = useLexicalNodeSelection(nodeKey);

  const activeEditorRef = React.useRef<LexicalEditor | null>(null);
  const imageRef = React.useRef<null | HTMLImageElement>(null);

  const $onDelete = React.useCallback(
    (payload: KeyboardEvent) => {
      const deleteSelection = $getSelection();
      if (isSelected && $isNodeSelection(deleteSelection)) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        editor.update(() => {
          deleteSelection.getNodes().forEach((node) => {
            if ($isImageNode(node)) {
              node.remove();
            }
          });
        });
      }
      return false;
    },
    [editor, isSelected],
  );

  React.useEffect(() => {
    let isMounted = true;

    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read(() => $getSelection()));
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),

      editor.registerCommand(
        KEY_DELETE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW,
      ),
    );

    return () => {
      isMounted = false;
      unregister();
    };
  }, [editor, nodeKey, $onDelete]);

  return (
    <React.Suspense fallback={null}>
      <div draggable="false">
        {isLoadError ? (
          <img />
        ) : (
          <LazyImage
            className=""
            src={src}
            altText={altText}
            imageRef={imageRef}
            width={width}
            height={height}
            maxWidth={maxWidth}
            onError={() => setIsLoadError(true)}
          />
        )}
      </div>
    </React.Suspense>
  );
}
