import { type ArticleBlock, type InlineNode } from '../contracts/types';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';

@ApiSchema({ name: 'ArticleTextNode' })
export class ArticleTextNodeDto implements Extract<
  InlineNode,
  { type: 'text' }
> {
  @ApiProperty({ enum: ['text'] })
  declare type: 'text';
  @ApiProperty({ type: 'string' })
  declare text: string;
  @ApiPropertyOptional({ type: Boolean })
  declare bold?: boolean;
  @ApiPropertyOptional({ type: Boolean })
  declare italic?: boolean;
}

@ApiSchema({ name: 'ArticleWordNode' })
export class ArticleWordNodeDto implements Extract<
  InlineNode,
  { type: 'word' }
> {
  @ApiProperty({ enum: ['word'] })
  declare type: 'word';
  @ApiProperty({ type: 'string' })
  declare text: string;
  @ApiPropertyOptional({ type: Boolean })
  declare bold?: boolean;
  @ApiPropertyOptional({ type: Boolean })
  declare italic?: boolean;
}

const inlineNodeSchema = {
  name: 'InlineNode',
  oneOf: [
    { $ref: getSchemaPath(ArticleTextNodeDto) },
    { $ref: getSchemaPath(ArticleWordNodeDto) },
  ],
  discriminator: {
    propertyName: 'type',
    mapping: {
      text: getSchemaPath(ArticleTextNodeDto),
      word: getSchemaPath(ArticleWordNodeDto),
    },
  },
};
@ApiExtraModels(ArticleTextNodeDto, ArticleWordNodeDto)
@ApiSchema(inlineNodeSchema)
export class InlineNodeDto {}

@ApiSchema({ name: 'TableCell' })
export class TableCellDto {
  @ApiProperty({ type: 'string' })
  declare text: string;
  @ApiPropertyOptional({ type: Boolean })
  declare header?: boolean;
}

@ApiSchema({ name: 'ArticleHeadingBlock' })
export class ArticleHeadingBlockDto implements Extract<
  ArticleBlock,
  { type: 'heading' }
> {
  @ApiProperty({ enum: ['heading'] })
  declare type: 'heading';
  @ApiProperty({ enum: [1, 2, 3], type: 'integer' })
  declare level: 1 | 2 | 3;
  @ApiProperty({ type: 'string' })
  declare text: string;
}

@ApiSchema({ name: 'ArticleParagraphBlock' })
export class ArticleParagraphBlockDto implements Extract<
  ArticleBlock,
  { type: 'paragraph' }
> {
  @ApiProperty({ enum: ['paragraph'] })
  declare type: 'paragraph';
  @ApiProperty({ type: 'array', items: { $ref: getSchemaPath(InlineNodeDto) } })
  declare children: InlineNode[];
}

@ApiSchema({ name: 'ArticleListBlock' })
export class ArticleListBlockDto implements Extract<
  ArticleBlock,
  { type: 'list' }
> {
  @ApiProperty({ enum: ['list'] })
  declare type: 'list';
  @ApiProperty({
    type: 'array',
    items: { type: 'array', items: { $ref: getSchemaPath(InlineNodeDto) } },
  })
  declare items: InlineNode[][];
  @ApiProperty({ type: Boolean })
  declare ordered: boolean;
}

@ApiSchema({ name: 'ArticleTableBlock' })
export class ArticleTableBlockDto implements Extract<
  ArticleBlock,
  { type: 'table' }
> {
  @ApiProperty({ enum: ['table'] })
  declare type: 'table';
  @ApiProperty({
    type: 'array',
    items: { type: 'array', items: { $ref: getSchemaPath(TableCellDto) } },
  })
  declare rows: TableCellDto[][];
}

@ApiSchema({ name: 'ArticleImageBlock' })
export class ArticleImageBlockDto implements Extract<
  ArticleBlock,
  { type: 'image' }
> {
  @ApiProperty({ enum: ['image'] })
  declare type: 'image';
  @ApiPropertyOptional({ type: 'string' })
  declare alt?: string;
  @ApiPropertyOptional({ type: 'string' })
  declare caption?: string;
  @ApiProperty({ type: 'string' })
  declare src: string;
}

@ApiSchema({ name: 'FormulaBlock' })
export class ArticleFormulaBlockDto implements Extract<
  ArticleBlock,
  { type: 'formula' }
> {
  @ApiProperty({ enum: ['formula'] })
  declare type: 'formula';
  @ApiProperty({ type: 'string' })
  declare altText: string;
  @ApiProperty({ type: Boolean })
  declare display: boolean;
  @ApiPropertyOptional({ type: Number })
  declare heightEx?: number;
  @ApiPropertyOptional({ type: Number })
  declare widthEx?: number;
  @ApiPropertyOptional({ type: 'string' })
  declare latex?: string;
  @ApiPropertyOptional({ type: 'string' })
  declare mathml?: string;
  @ApiPropertyOptional({ type: 'string' })
  declare svg?: string;
}

const articleBlockSchema = {
  name: 'ArticleBlock',
  oneOf: [
    { $ref: getSchemaPath(ArticleHeadingBlockDto) },
    { $ref: getSchemaPath(ArticleParagraphBlockDto) },
    { $ref: getSchemaPath(ArticleListBlockDto) },
    { $ref: getSchemaPath(ArticleTableBlockDto) },
    { $ref: getSchemaPath(ArticleImageBlockDto) },
    { $ref: getSchemaPath(ArticleFormulaBlockDto) },
  ],
  discriminator: {
    propertyName: 'type',
    mapping: {
      heading: getSchemaPath(ArticleHeadingBlockDto),
      paragraph: getSchemaPath(ArticleParagraphBlockDto),
      list: getSchemaPath(ArticleListBlockDto),
      table: getSchemaPath(ArticleTableBlockDto),
      image: getSchemaPath(ArticleImageBlockDto),
      formula: getSchemaPath(ArticleFormulaBlockDto),
    },
  },
};
@ApiExtraModels(
  InlineNodeDto,
  TableCellDto,
  ArticleHeadingBlockDto,
  ArticleParagraphBlockDto,
  ArticleListBlockDto,
  ArticleTableBlockDto,
  ArticleImageBlockDto,
  ArticleFormulaBlockDto,
)
@ApiSchema(articleBlockSchema)
export class ArticleBlockDto {}
