// Source: https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/DraggableBlockPlugin/index.tsx

import { GripVerticalIcon } from "@chat/ui/icons";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import * as React from "react";

const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export function DraggableBlockPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const targetLineRef = React.useRef<HTMLDivElement>(null);

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div
          ref={menuRef}
          className="icon draggable-block-menu absolute left-0 top-0 cursor-grab rounded-sm p-0.5 opacity-0 will-change-transform hover:bg-accent active:cursor-grabbing"
        >
          <GripVerticalIcon className="size-4 opacity-30" aria-hidden />
        </div>
      }
      targetLineComponent={
        <div
          ref={targetLineRef}
          className="draggable-block-target-line pointer-events-none absolute left-0 top-0 h-1 bg-foreground opacity-0 will-change-transform"
        />
      }
      isOnMenu={isOnMenu}
    />
  );
}
