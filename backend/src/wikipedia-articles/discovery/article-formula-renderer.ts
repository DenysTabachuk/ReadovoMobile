import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

import { type ArticleBlock, type FormulaBlock } from '../contracts/types';

const nodeRequire = createRequire(__filename);

type MathJaxModule = {
  init: (config: Record<string, unknown>) => Promise<MathJaxModule>;
  mathml2svgPromise: (
    mathml: string,
    options: { display: boolean },
  ) => Promise<unknown>;
  startup: {
    adaptor: {
      firstChild: (node: unknown) => unknown;
      getAttribute: (node: unknown, name: string) => string | undefined;
      serializeXML: (node: unknown) => string;
    };
  };
  tex2svgPromise: (
    latex: string,
    options: { display: boolean },
  ) => Promise<unknown>;
};

@Injectable()
export class ArticleFormulaRenderer {
  private readonly cache = new Map<string, FormulaBlock>();
  private readonly logger = new Logger(ArticleFormulaRenderer.name);
  private mathJaxPromise: Promise<MathJaxModule> | null = null;

  render(blocks: ArticleBlock[]): Promise<ArticleBlock[]> {
    return Promise.all(
      blocks.map((block) =>
        block.type === 'formula'
          ? this.renderFormula(block)
          : Promise.resolve(block),
      ),
    );
  }

  private async renderFormula(block: FormulaBlock): Promise<FormulaBlock> {
    if (block.svg || (!block.latex && !block.mathml)) {
      return block;
    }

    const cacheKey = this.createCacheKey(block);
    const cachedBlock = this.cache.get(cacheKey);

    if (cachedBlock) {
      return cachedBlock;
    }

    try {
      const mathJax = await this.getMathJax();
      const renderedNode = block.mathml
        ? await mathJax.mathml2svgPromise(block.mathml, {
            display: block.display,
          })
        : await mathJax.tex2svgPromise(block.latex ?? '', {
            display: block.display,
          });
      const adaptor = mathJax.startup.adaptor;
      const svgNode = adaptor.firstChild(renderedNode);

      if (!svgNode) {
        return block;
      }

      const renderedBlock: FormulaBlock = {
        ...block,
        heightEx:
          this.parseExLength(adaptor.getAttribute(svgNode, 'height')) ??
          block.heightEx,
        svg: adaptor.serializeXML(svgNode),
        widthEx:
          this.parseExLength(adaptor.getAttribute(svgNode, 'width')) ??
          block.widthEx,
      };

      this.cache.set(cacheKey, renderedBlock);
      return renderedBlock;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to render math formula to SVG: reason="${reason}"`,
      );
      return block;
    }
  }

  private createCacheKey(block: FormulaBlock): string {
    return createHash('sha256')
      .update(
        `${block.display ? 'display' : 'inline'}::${block.latex ?? ''}::${block.mathml ?? ''}`,
      )
      .digest('hex');
  }

  private parseExLength(value?: string): number | undefined {
    const match = value?.match(/^([0-9]+(?:\.[0-9]+)?)ex$/i);
    const parsedValue = Number.parseFloat(match?.[1] ?? '');

    return Number.isFinite(parsedValue) && parsedValue > 0
      ? parsedValue
      : undefined;
  }

  private getMathJax(): Promise<MathJaxModule> {
    this.mathJaxPromise ??= this.initializeMathJax();
    return this.mathJaxPromise;
  }

  private async initializeMathJax(): Promise<MathJaxModule> {
    (
      globalThis as {
        MathJax?: { config: Record<string, unknown> };
      }
    ).MathJax = { config: {} };

    const mathJax = nodeRequire('mathjax/node-main.cjs') as MathJaxModule;
    await mathJax.init({
      loader: { load: ['input/tex', 'input/mathml', 'output/svg'] },
      svg: { fontCache: 'none' },
    });

    return mathJax;
  }
}
