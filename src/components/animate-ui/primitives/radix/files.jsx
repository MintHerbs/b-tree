import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';

import {
  Highlight,
  HighlightItem,
} from '../../primitives/effects/highlight';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
} from '../../primitives/radix/accordion';
import { getStrictContext } from '../../../../lib/get-strict-context';
import { useControlledState } from '../../../../hooks/use-controlled-state';

const [FilesProvider, useFiles] =
  getStrictContext('FilesContext');

const [FolderProvider, useFolder] =
  getStrictContext('FolderContext');

function Files({
  children,
  defaultOpen = [],
  open,
  onOpenChange,
  style,
  ...props
}) {
  const [openValue, setOpenValue] = useControlledState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  return (
    <FilesProvider value={{ open: openValue ?? [] }}>
      <Accordion
        data-slot="files"
        type="multiple"
        defaultValue={defaultOpen}
        value={open}
        onValueChange={setOpenValue}
        style={{
          position: 'relative',
          overflow: 'auto',
          ...style,
        }}
        {...props}
      >
        {children}
      </Accordion>
    </FilesProvider>
  );
}

function FilesHighlight({ hover = true, ...props }) {
  return (
    <Highlight
      data-slot="files-highlight"
      controlledItems
      mode="parent"
      hover={hover}
      {...props}
    />
  );
}

function FolderItem({ value, ...props }) {
  const { open } = useFiles();

  return (
    <FolderProvider value={{ isOpen: open.includes(value) }}>
      <AccordionItem data-slot="folder-item" value={value} {...props} />
    </FolderProvider>
  );
}

function FolderHeader(props) {
  return <AccordionHeader data-slot="folder-header" {...props} />;
}

function FolderTrigger(props) {
  return <AccordionTrigger data-slot="folder-trigger" {...props} />;
}

function FolderContent(props) {
  return <AccordionContent data-slot="folder-content" {...props} />;
}

function FolderHighlight(props) {
  return <HighlightItem data-slot="folder-highlight" {...props} />;
}

function Folder(props) {
  return <div data-slot="folder" {...props} />;
}

function FolderIcon({
  closeIcon,
  openIcon,
  transition = { duration: 0.15 },
  ...props
}) {
  const { isOpen } = useFolder();

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={isOpen ? 'open' : 'close'}
        data-slot="folder-icon"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={transition}
        {...props}
      >
        {isOpen ? openIcon : closeIcon}
      </motion.span>
    </AnimatePresence>
  );
}

function FolderLabel(props) {
  return <span data-slot="folder-label" {...props} />;
}

function FileHighlight(props) {
  return <HighlightItem data-slot="file-highlight" {...props} />;
}

function File(props) {
  return <div data-slot="file" {...props} />;
}

function FileIcon(props) {
  return <span data-slot="file-icon" {...props} />;
}

function FileLabel(props) {
  return <span data-slot="file-label" {...props} />;
}

export {
  Files,
  FilesHighlight,
  FolderItem,
  FolderHeader,
  FolderTrigger,
  FolderContent,
  FileHighlight,
  File,
  FileIcon,
  FileLabel,
  FolderHighlight,
  Folder,
  FolderIcon,
  FolderLabel,
  useFiles,
  useFolder,
};
