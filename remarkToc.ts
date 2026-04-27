import { Options as TocOptions, toc } from 'npm:mdast-util-toc@7.1.0';
import { Plugin } from 'npm:unified@11';

interface RemarkTocCollapseOptions extends TocOptions {
  heading?: string;
}

type TocRoot = Parameters<typeof toc>[0];
type MutableTocRoot = TocRoot & {
  children: unknown[];
};

/**
 * Plugin to generate a Table of Contents (TOC); does not remove leading paragraphs without headers.
 */
const remarkToc: Plugin<[(RemarkTocCollapseOptions | undefined)?], TocRoot> = (options = {}) => {
  return (node: TocRoot) => {
    const result = toc(
      node,
      Object.assign({}, options, {
        heading: options.heading || 'toc|table[ -]of[ -]contents?',
        tight: true,
        maxDepth: 10,
      }),
    );

    if (
      result.endIndex === null ||
      result.index === null ||
      result.index === -1 ||
      !result.map
    ) {
      return;
    }

    // I don't want remarkToc to remove leading paragraphs with no headers
    if ('children' in node) {
      const mutableNode = node as MutableTocRoot;
      mutableNode.children = [
        ...mutableNode.children.slice(0, result.index),

        result.map,

        ...mutableNode.children.slice(result.index),
      ];
    }
  };
};

export default remarkToc;
